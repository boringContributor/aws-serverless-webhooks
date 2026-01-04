import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebhookApi } from './webhook-api';
import { WebhookDelivery } from './storage';

export interface WebhooksStackProps extends cdk.StackProps {}

export class WebhooksStack extends cdk.Stack {
  public readonly webhookApi: WebhookApi;
  public readonly storage: WebhookDelivery;
  constructor(scope: Construct, id: string, props?: WebhooksStackProps) {
    super(scope, id, props);

    this.storage = new WebhookDelivery(this, 'WebhookDelivery');
    this.webhookApi = new WebhookApi(this, 'WebhookApi');
  }
}
