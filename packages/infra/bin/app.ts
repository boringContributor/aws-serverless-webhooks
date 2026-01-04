#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WebhooksStack } from '../lib/webhook-stack';

const app = new cdk.App();

new WebhooksStack(app, 'WebhooksStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Serverless Webhook As a Service',
});

app.synth();
