import { getWebhookClient } from "./client"
import type { Paths } from '@webhooks/client'

export const getConfig = async (configId: string) => {
  const client = await getWebhookClient();

  return client.getWebhookConfig({ webhook_id: configId }).then(res => {
    return res.data?.data;
  }).catch(err => {
    console.error('Get webhook config error:', err);
    throw err;
  });
}

export const createConfig = async (data: Paths.CreateWebhookConfig.RequestBody) => {
  const client = await getWebhookClient();

  return client.createWebhookConfig(null, data).then(res => {
    return res.data;
  }).catch(err => {
    console.error('Create webhook error:', err);
    throw err;
  });
}

export const updateConfig = async (configId: string, data: Paths.UpdateWebhookConfig.RequestBody) => {
  const client = await getWebhookClient();

  return client.updateWebhookConfig({ webhook_id: configId }, data).then(res => {
    return res.data;
  }).catch(err => {
    console.error('Update webhook error:', err);
    throw err;
  });
}

export const deleteConfig = async (configId: string) => {
  const client = await getWebhookClient();

  return client.deleteWebhookConfig({ webhook_id: configId }).then(res => {
    return res.data;
  }).catch(err => {
    console.error('Delete webhook error:', err);
    throw err;
  });
}

export const listConfigs = async () => {
  const client = await getWebhookClient();


  return client.listWebhooks().then(res => {
    return res.data;
  }).catch(err => {
    console.error('List webhooks error:', err);
    throw err;
  });
}

export const dispatchWebhook = async () => {
  const client = await getWebhookClient();

  return client.dispatchWebhook(null, {
    data: {
      'test': 'value'
    },
    event_type: 'user.created',
  }).then(res => {
    return res.data;
  }).catch(err => {
    console.error('Dispatch webhook error:', err);
    throw err;
  });
}

export const listEvents = async (params: { webhookId: string, cursor?: string }) => {
  const client = await getWebhookClient();

  return client.listEvents({ webhook_id: params.webhookId, cursor: params.cursor }).then(res => {
    return res.data;
  }).catch(err => {
    console.error('List events error:', err);
    throw err;
  });
}

export const getEventById = async (params: { eventId: string, webhookId: string }) => {
  const client = await getWebhookClient();

  return client.getEventById({ event_id: params.eventId, webhook_id: params.webhookId }).then(res => {
    return res.data;
  }).catch(err => {
    console.error('Get event by ID error:', err);
    throw err;
  });
}