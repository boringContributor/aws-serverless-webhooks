import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

/**
 * Storage layer for webhooks
 * Contains separate DynamoDB tables for config and events, plus KMS key
 */
export class WebhookStorage extends Construct {
  public readonly configTable: dynamodb.Table;
  public readonly eventsTable: dynamodb.Table;
  public readonly secretKey: kms.Key;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // KMS key for encrypting webhook secrets
    this.secretKey = new kms.Key(this, 'WebhookSecretKey', {
      description: 'KMS key for encrypting webhook secrets',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
    });

    // Webhook configuration table
    this.configTable = new dynamodb.Table(this, 'WebhookConfigTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      deletionProtection: false, // NOT recommended for production
    });

    // GSI for webhook config table (e.g., query by webhook_id)
    this.configTable.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
    });

    // Webhook events/delivery history table
    this.eventsTable = new dynamodb.Table(this, 'WebhookEventsTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      deletionProtection: false, // NOT recommended for production
    });

    // GSI for events table (e.g., query by event_id)
    this.eventsTable.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
    });

    // Outputs
    new cdk.CfnOutput(this, 'ConfigTableName', {
      value: this.configTable.tableName,
      description: 'Webhook config DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'EventsTableName', {
      value: this.eventsTable.tableName,
      description: 'Webhook events DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.secretKey.keyId,
      description: 'KMS key ID for webhook secrets',
    });
  }
}
