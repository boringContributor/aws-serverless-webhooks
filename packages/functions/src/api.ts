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