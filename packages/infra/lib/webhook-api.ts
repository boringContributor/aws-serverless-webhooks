import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { WebhookDelivery } from './storage';

export class WebhookApi extends Construct {
  public readonly api: HttpApi;
  public readonly webhookLambda: lambda.Function;
  public readonly webhookDispatcherLambda: lambda.Function;
  public readonly webhookDeliveryLambda: lambda.Function;
  public readonly webhookDelivery: WebhookDelivery;
  
  constructor(scope: Construct, id: string) {
    super(scope, id);


    this.webhookLambda = new NodejsFunction(this, 'WebhookApiHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(
        __dirname,
        '../../functions/src/index.ts'
      ),
      environment: {
        WEBHOOKS_TABLE_NAME: this.webhookDelivery.configTable.tableName,
        WEBHOOK_SECRET_KMS_KEY_ID: this.webhookDelivery.webhookSecretKey.keyId,
      },
      timeout: cdk.Duration.seconds(30),
      logRetention: RetentionDays.ONE_WEEK,
      bundling: {
        sourceMap: true,
        // Hook into Commands for adding the OpenAPI Specification to Output
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          // Add the OpenAPI specification to the Lambda bundle
          afterBundling: (_inputDir: string, outputDir: string) => [
            `cp "${path.join(__dirname, '../../functions/openapi.yml')}" "${outputDir}/openapi.yml"`,
          ],
        },
      },
    });

    this.api = new HttpApi(this, 'WebhookApi', {
      apiName: 'webhook-api',
      corsPreflight: {
        allowOrigins: ['*'],
        allowHeaders: ['content-type', 'authorization'],
        maxAge: cdk.Duration.days(1),
      },
    });

    this.api.addRoutes({
      path: '/{proxy+}',
      // ALL methods expect OPTIONS / ANY should be handled by our Lambda
      methods: Object.values(HttpMethod).filter(
        (method) => method !== HttpMethod.OPTIONS && method !== HttpMethod.ANY
      ),
      integration: new HttpLambdaIntegration(
        'OpenAPIBackendIntegration',
        this.webhookLambda
      ),
    });

    const queryIntegration = new apigateway.LambdaIntegration(
      this.webhookLambda,
      {
        proxy: true,
      }
    );

    this.webhookDelivery.configTable.grantReadWriteData(this.webhookLambda);
    this.webhookDelivery.webhookSecretKey.grantEncryptDecrypt(this.webhookLambda);

    // Webhook Dispatcher Lambda (triggered by EventBridge)
    this.webhookDispatcherLambda = new NodejsFunction(this, 'WebhookDispatcher', {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../../functions/src/webhook-dispatcher.ts'),
      handler: 'handler',
      environment: {
        WEBHOOKS_TABLE_NAME: this.webhookDelivery.configTable.tableName,
        WEBHOOK_DELIVERY_QUEUE_URL: this.webhookDelivery.webhookDeliveryQueue.queueUrl,
      },
      timeout: cdk.Duration.seconds(30),
      logRetention: RetentionDays.ONE_WEEK,
    });

    // Grant dispatcher permissions
    this.webhookDelivery.configTable.grantReadData(this.webhookDispatcherLambda);
    this.webhookDelivery.webhookDeliveryQueue.grantSendMessages(this.webhookDispatcherLambda);

    this.webhookDeliveryLambda = new NodejsFunction(this, 'WebhookDelivery', {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../../functions/src/webhook-delivery.ts'),
      handler: 'handler',
      environment: {
        WEBHOOKS_TABLE_NAME: this.webhookDelivery.configTable.tableName,
      },
      timeout: cdk.Duration.seconds(60),
      logRetention: RetentionDays.ONE_WEEK,
      reservedConcurrentExecutions: 10, // Limit concurrent deliveries
    });

    this.webhookDelivery.configTable.grantReadData(this.webhookDeliveryLambda);
    this.webhookDelivery.webhookSecretKey.grantDecrypt(this.webhookDeliveryLambda);

    this.webhookDeliveryLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(this.webhookDelivery.webhookDeliveryQueue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      })
    );

    new cdk.CfnOutput(this, 'WebhookApiEndpoint', {
      value: this.api.apiEndpoint,
      description: 'Webhook API Gateway endpoint URL',
      exportName: 'WebhookApiEndpoint',
    });
  }
}
