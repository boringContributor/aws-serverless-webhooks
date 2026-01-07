import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as aws_lambda_event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import path from 'node:path';
import { WebhookStorage } from './webhook-storage';

export interface WebhookDeliveryProps {
  storage: WebhookStorage;
}

export class WebhookDelivery extends Construct {
  public readonly queue: sqs.Queue;
  public readonly dlq: sqs.Queue;
  public readonly deliveryFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: WebhookDeliveryProps) {
    super(scope, id);

    this.dlq = new sqs.Queue(this, 'DeliveryDLQ', {
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.queue = new sqs.Queue(this, 'DeliveryQueue', {
      visibilityTimeout: cdk.Duration.seconds(60), // Match Lambda timeout
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3, // Retry 3 times before moving to DLQ
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.deliveryFunction = new NodejsFunction(this, 'DeliveryFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../../functions/src/webhook-delivery.ts'),
      handler: 'handler',
      environment: {
        WEBHOOKS_TABLE_NAME: props.storage.configTable.tableName,
        WEBHOOK_EVENTS_TABLE_NAME: props.storage.eventsTable.tableName,
      },
      durableConfig: {
        executionTimeout: cdk.Duration.minutes(15),
      },
      timeout: cdk.Duration.seconds(60),
      logRetention: RetentionDays.ONE_WEEK,
    });

    // Grant permissions to both tables
    props.storage.configTable.grantReadData(this.deliveryFunction);
    props.storage.eventsTable.grantReadWriteData(this.deliveryFunction);
    props.storage.secretKey.grantDecrypt(this.deliveryFunction);

    this.deliveryFunction.latestVersion.addEventSource(
      new aws_lambda_event_sources.SqsEventSource(this.queue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      })
    );
  }
}
