import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class WebhookDelivery extends Construct {
public readonly configTable: dynamodb.Table;
public readonly eventsTable: dynamodb.Table;
public readonly webhookSecretKey: kms.Key;
public readonly webhookDeliveryQueue: sqs.Queue;
public readonly webhookDeliveryDLQ: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.webhookSecretKey = new kms.Key(this, 'WebhookSecretKey', {
      description: 'KMS key for encrypting webhook secrets',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    this.configTable = new dynamodb.Table(this, 'WebhookConfigTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      deletionProtection: false, // NOT recommended for production code
    });

    this.configTable.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
    });

    this.eventsTable = new dynamodb.Table(this, 'WebhookEventsTable', {
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      deletionProtection: false, // NOT recommended for production code
    });

    this.webhookDeliveryDLQ = new sqs.Queue(this, 'WebhookDeliveryDLQ', {
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.webhookDeliveryQueue = new sqs.Queue(this, 'WebhookDeliveryQueue', {
      visibilityTimeout: cdk.Duration.seconds(60), // Match Lambda timeout
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        queue: this.webhookDeliveryDLQ,
        maxReceiveCount: 3, // Retry 3 times before moving to DLQ
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
