import { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { WebhookService } from '@webhooks/core';
import { logger } from '@webhooks/common/powertools';
import { z } from 'zod';

const DELIVERY_SCHEMA = z.object({
    tenant_id: z.string(),
    webhook_id: z.string(),
    event_type: z.string(),
    payload: z.object().loose()
});

/**
 * Lambda handler that consumes SQS messages
 * and delivers individual webhooks via HTTP
 */
export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];
  logger.info(`Processing ${event.Records.length} webhook delivery messages`);

  const promises = event.Records.map((record) => {
    const message = DELIVERY_SCHEMA.safeParse(JSON.parse(record.body));

    if (!message.success) {
      logger.error('Invalid webhook delivery message - skipping', { error: message.error, recordBody: record.body });
      return;
    }
    
    return WebhookService.deliverWebhook({
      webhook_id: message.data.webhook_id,
      event_type: message.data.event_type,
      event_data: message.data.payload,
      tenant_id: message.data.tenant_id
    });
  }).filter(Boolean)

  const results = await Promise.allSettled(promises);

  const failures = results
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => result.status === 'rejected');

    for (const { index } of failures) {
        batchItemFailures.push({ itemIdentifier: event.Records[index].messageId });
    }


  logger.info(`All ${results.length} webhooks delivered successfully`);
  
  return { batchItemFailures };
};
