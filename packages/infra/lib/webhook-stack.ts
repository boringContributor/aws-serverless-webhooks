import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebhookStorage } from './webhook-storage';
import { WebhookDelivery } from './webhook-delivery';
import { WebhookApi } from './webhook-api';

export interface WebhooksStackProps extends cdk.StackProps {}

export class WebhooksStack extends cdk.Stack {
  public readonly storage: WebhookStorage;
  public readonly delivery: WebhookDelivery;
  public readonly api: WebhookApi;

  constructor(scope: Construct, id: string, props?: WebhooksStackProps) {
    super(scope, id, props);

    this.storage = new WebhookStorage(this, 'Storage');

    this.delivery = new WebhookDelivery(this, 'Delivery', {
      storage: this.storage,
    });

    this.api = new WebhookApi(this, 'Api', {
      storage: this.storage,
      delivery: this.delivery,
    });
  }
}
