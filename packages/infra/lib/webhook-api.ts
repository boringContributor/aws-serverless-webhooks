import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpApi, HttpMethod, CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { WebhookStorage } from './webhook-storage';
import { WebhookDelivery } from './webhook-delivery';

export interface WebhookApiProps {
  storage: WebhookStorage;
  delivery: WebhookDelivery;
}

export class WebhookApi extends Construct {
  public readonly api: HttpApi;
  public readonly webhookLambda: lambda.Function;
  public readonly webhookDispatcherLambda: lambda.Function;
  
  constructor(scope: Construct, id: string, props: WebhookApiProps) {
    super(scope, id);


    // API handler Lambda
    this.webhookLambda = new NodejsFunction(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../../functions/src/index.ts'),
      environment: {
        WEBHOOKS_TABLE_NAME: props.storage.configTable.tableName,
        WEBHOOK_EVENTS_TABLE_NAME: props.storage.eventsTable.tableName,
        WEBHOOK_DELIVERY_QUEUE_URL: props.delivery.queue.queueUrl,
        WEBHOOK_SECRET_KMS_KEY_ID: props.storage.secretKey.keyId,
      },
      timeout: cdk.Duration.seconds(30),
      logRetention: RetentionDays.ONE_WEEK,
      bundling: {
        sourceMap: true,
        loader: {
          ".yml": "file",
        },
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (_inputDir: string, outputDir: string) => [
            `cp "${path.join(__dirname, '../../functions/openapi.yml')}" "${outputDir}/openapi.yml"`,
          ],
        },
      },
    });

    this.api = new HttpApi(this, 'Api', {
      apiName: 'webhook-api',
      corsPreflight: {
        allowOrigins: ['*'],
        allowHeaders: ['content-type', 'authorization', 'x-api-key'],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.HEAD,
        ],
        maxAge: cdk.Duration.days(1),
      },
    });

    this.api.addRoutes({
      path: '/{proxy+}',
      methods: Object.values(HttpMethod).filter(
        (method) => method !== HttpMethod.OPTIONS && method !== HttpMethod.ANY
      ),
      integration: new HttpLambdaIntegration(
        'ApiIntegration',
        this.webhookLambda
      ),
    });

    // Grant API handler permissions
    props.storage.configTable.grantReadWriteData(this.webhookLambda);
    props.storage.eventsTable.grantReadData(this.webhookLambda);
    props.storage.secretKey.grantEncryptDecrypt(this.webhookLambda);
    props.delivery.queue.grantSendMessages(this.webhookLambda);

    // Webhook Dispatcher Lambda (for EventBridge integration)
    this.webhookDispatcherLambda = new NodejsFunction(this, 'DispatcherFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../../functions/src/webhook-dispatcher.ts'),
      handler: 'handler',
      environment: {
        WEBHOOKS_TABLE_NAME: props.storage.configTable.tableName,
        WEBHOOK_DELIVERY_QUEUE_URL: props.delivery.queue.queueUrl,
      },
      timeout: cdk.Duration.seconds(30),
      logRetention: RetentionDays.ONE_WEEK,
    });

    // Grant dispatcher permissions
    props.storage.configTable.grantReadData(this.webhookDispatcherLambda);
    props.delivery.queue.grantSendMessages(this.webhookDispatcherLambda);

    new cdk.CfnOutput(this, 'WebhookApiEndpoint', {
      value: this.api.apiEndpoint,
      description: 'Webhook API Gateway endpoint URL',
      exportName: 'WebhookApiEndpoint',
    });
  }
}
