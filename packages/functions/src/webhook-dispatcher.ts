import { EventBridgeEvent } from 'aws-lambda';
import { WebhookService } from '@webhooks/core';
import { logger } from '@webhooks/common/powertools';

/**
 * Example lambda handler that receives events from EventBridge
 * and dispatches webhook deliveries to SQS
 */
export const handler = async (event: EventBridgeEvent<string, {
  tenant_id: string;
  event_type: string;
  data: unknown;
}>) => {
  logger.info('Received EventBridge event:', { event });

  const { tenant_id, event_type, data } = event.detail;

  try {
    const result = await WebhookService.dispatchWebhookDeliveries({
      tenant_id,
      event_type,
      data
    });

    logger.info(`Enqueued webhooks:`, { webhook_ids: result.webhook_ids, enqueued: result.enqueued });
  } catch (error) {
    logger.error('Failed to dispatch webhooks:', { error });
    throw error;
  }
};
