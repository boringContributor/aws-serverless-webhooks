import { getWebhookClient } from "./client"
import type { Paths } from '@webhooks/client'

export const getConfig = async (configId: string) => {
  const client = await getWebhookClient();
  console.log('Fetching webhook config:', configId);

  return client.getWebhookConfig({ webhook_id: configId }).then(res => {
    console.log('Get webhook config response:', res);
    return res.data?.data;
  }).catch(err => {
    console.error('Get webhook config error:', err);
    throw err;
  });
}

export const createConfig = async (data: Paths.CreateWebhookConfig.RequestBody) => {
  const client = await getWebhookClient();
  console.log('Creating webhook:', data);

  return client.createWebhookConfig(null, data).then(res => {
    console.log('Create webhook response:', res);
    return res.data;
  }).catch(err => {
    console.error('Create webhook error:', err);
    throw err;
  });
}

export const updateConfig = async (configId: string, data: Paths.UpdateWebhookConfig.RequestBody) => {
  const client = await getWebhookClient();
  console.log('Updating webhook:', configId, data);

  return client.updateWebhookConfig({ webhook_id: configId }, data).then(res => {
    console.log('Update webhook response:', res);
    return res.data;
  }).catch(err => {
    console.error('Update webhook error:', err);
    throw err;
  });
}

export const deleteConfig = async (configId: string) => {
  const client = await getWebhookClient();
  console.log('Deleting webhook:', configId);

  return client.deleteWebhookConfig({ webhook_id: configId }).then(res => {
    console.log('Delete webhook response:', res);
    return res.data;
  }).catch(err => {
    console.error('Delete webhook error:', err);
    throw err;
  });
}

export const listConfigs = async () => {
  const client = await getWebhookClient();
  console.log('Fetching webhooks from:', client.defaults.baseURL);

  return client.listWebhooks().then(res => {
    console.log('List webhooks response:', res);
    return res.data;
  }).catch(err => {
    console.error('List webhooks error:', err);
    throw err;
  });
}

export const dispatchWebhook = async () => {
  const client = await getWebhookClient();
  console.log('Dispatch new webhook event from:', client.defaults.baseURL);

  return client.dispatchWebhook(null, {
    data: {
      'test': 'value'
    },
    event_type: 'user.created',
  }).then(res => {
    console.log('Dispatch webhook response:', res);
    return res.data;
  }).catch(err => {
    console.error('Dispatch webhook error:', err);
    throw err;
  });
}