import { toApiResponse } from './openapi/utils';
import type { OperationHandler } from './types/openapi';
import { WebhookService } from '@webhooks/core';

export const createWebhookConfig: OperationHandler<'createWebhookConfig'> = async (c) => {
  const body = c.request.requestBody

  const tenant_id = 'from jwt'; // TODO: Extract from JWT token
  const userId = 'from jwt'; // TODO: Extract from JWT token

  const result = await WebhookService.createWebhook({
    tenant_id,
    endpoint: body.endpoint,
    event_types: body.event_types,
    name: body.name,
    created_by: userId
  });

  return toApiResponse({
    statusCode: 201,
    body: result.data
  });
}

export const getWebhookConfig: OperationHandler<'getWebhookConfig'> = async (c) => {
  const webhook_id = c.request.params.webhook_id;

  const tenant_id = 'from jwt'; // TODO: Extract from JWT token

  const result = await WebhookService.getWebhook({
    tenant_id,
    webhook_id
  });

  if (!result.data) {
    return {
      status: 404,
      body: { error: 'Webhook not found' }
    };
  }

  return toApiResponse({
    statusCode: 200,
    body: result
  });
}

export const listWebhookConfigs: OperationHandler<'listWebhooks'> = async (c) => {
  const tenant_id = 'from jwt'; // TODO: Extract from JWT token

  const result = await WebhookService.listWebhooks({ tenant_id });

  return toApiResponse({
    statusCode: 200,
    body: result
  });
}

export const updateWebhookConfig: OperationHandler<'updateWebhookConfig'> = async (c) => {
  const webhook_id = c.request.params.webhook_id;
  const { name, endpoint, event_types, status } = c.request.requestBody;

  const tenant_id = 'from jwt'; // TODO: Extract from JWT token
  const userId = 'from jwt'; // TODO: Extract from JWT token

  const result = await WebhookService.updateWebhook({
    tenant_id,
    webhook_id,
    name,
    endpoint,
    event_types,
    status,
    updated_by: userId
  });

  return toApiResponse({
    statusCode: 200,
    body: result
  });
}

export const deleteWebhookConfig: OperationHandler<'deleteWebhookConfig'> = async (c) => {
  const webhook_id = c.request.params.webhook_id;

  const tenant_id = 'from jwt'; // TODO: Extract from JWT token

  await WebhookService.deleteWebhook({
    tenant_id,
    webhook_id
  });

  return toApiResponse({
    statusCode: 204
  });
}

export const rotateWebhookSecret: OperationHandler<'rotateWebhookSecret'> = async (c) => {
  const webhook_id = c.request.params.webhook_id;

  const tenant_id = 'from jwt'; // TODO: Extract from JWT token
  const userId = 'from jwt'; // TODO: Extract from JWT token

  const result = await WebhookService.rotateWebhookSecret({
    tenant_id,
    webhook_id,
    updated_by: userId
  });

  return toApiResponse({
    statusCode: 200,
    body: result
  });
}

export const dispatchWebhook: OperationHandler<'dispatchWebhook'> = async (c) => {
  const { event_type, data } = c.request.requestBody;

  const tenant_id = 'from jwt'; // TODO: Extract from JWT token

  const result = await WebhookService.dispatchWebhookDeliveries({
    tenant_id,
    event_type,
    data
  });

  return toApiResponse({
    statusCode: 200,
    body: result
  });
}

export const listEvents: OperationHandler<'listEvents'> = async (c) => {
  const webhook_id = c.request.params.webhook_id;
  const limit = c.request.query.limit ?? 20;
  const cursor = c.request.query.cursor as string | undefined;

  const tenant_id = 'from jwt'; // TODO: Extract from JWT token

  const webhook = await WebhookService.getWebhook({
    tenant_id,
    webhook_id
  });

  if (!webhook.data) {
    return toApiResponse({
      statusCode: 404,
      body: { error: 'Webhook not found' }
    });
  }

  const result = await WebhookService.listEvents({
    tenant_id,
    webhook_id,
    limit,
    cursor
  });

  return toApiResponse({
    statusCode: 200,
    body: result
  });
}

export const getEventById: OperationHandler<'getEventById'> = async (c) => {
  const webhook_id = c.request.params.webhook_id;
  const event_id = c.request.params.event_id;

  const tenant_id = 'from jwt'; // TODO: Extract from JWT token

  const result = await WebhookService.getEventById({
    tenant_id,
    webhook_id,
    event_id
  });

  if (!result.data) {
    return toApiResponse({
      statusCode: 404,
      body: { error: 'Event not found' }
    });
  }

  return toApiResponse({
    statusCode: 200,
    body: result
  });
}