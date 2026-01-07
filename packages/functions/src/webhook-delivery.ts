import { withDurableExecution, DurableContext } from '@aws/durable-execution-sdk-js';
import { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { WebhookService } from '@webhooks/core';
import { logger } from '@webhooks/common/powertools';
import { z } from 'zod';

const DELIVERY_SCHEMA = z.object({
  tenant_id: z.string(),
  webhook_id: z.string(),
  event_type: z.string(),
  payload: z.object().loose()
});

export const handler = withDurableExecution(
  async (payload: any, context: DurableContext): Promise<SQSBatchResponse> => {
    // When invoked via event source mapping, payload IS the SQS event
    context.logger.info('Starting webhook delivery handler with durable execution', { payload });
    const sqsEvent = payload as SQSEvent;
    const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];

    logger.info(`Processing ${sqsEvent.Records.length} webhook delivery messages with durable execution`);

    const results = await context.map(
      sqsEvent.Records,
      async (ctx, record) => {
        const validated = await ctx.step('validation', async () => {
          const message = DELIVERY_SCHEMA.safeParse(JSON.parse(record.body));

          if (!message.success) {
            logger.error('Invalid webhook delivery message - skipping', {
              error: message.error,
              recordBody: record.body
            });
            // (don't retry these)
            return null;
          }

          return message.data;
        });

        if (!validated) {
          return { message_id: record.messageId, success: true }; // Don't retry invalid messages
        }

        const http_response = await ctx.step('delivery', async () => {
          return await WebhookService.deliverWebhook({
            webhook_id: validated.webhook_id,
            event_type: validated.event_type,
            event_data: validated.payload,
            tenant_id: validated.tenant_id
          });
        }, {
          retryStrategy: (_, attemptCount) => {
            if (attemptCount >= 5) {
              return { shouldRetry: false };
            } 
            // Exponential backoff: 2s, 4s, 8s, 16s, 32s (capped at 300s)
            const delay = Math.min(2 * Math.pow(2, attemptCount - 1), 300);
            return { shouldRetry: true, delay: { seconds: delay } };
          }
        });

        await ctx.step('persistence', async () => {
          return await WebhookService.recordDeliveryEvent({
            tenant_id: validated.tenant_id,
            webhook_id: validated.webhook_id,
            event_type: validated.event_type,
            message_id: http_response.message_id,
            message_payload: validated.payload,
            response_body: http_response.response_body,
            http_status_code: http_response.status,
            status: http_response.status >= 200 && http_response.status < 300 ? 'success' : 'failure',
            error_message: http_response.status >= 200 && http_response.status < 300 ? undefined : `HTTP ${http_response.status}`,
          });
        });

        return { message_id: record.messageId, success: true, http_response };
      }
    );

    const recordResults = results.getResults();
    for (const result of recordResults) {
      if (result && !result.success) {
        batchItemFailures.push({ itemIdentifier: result.message_id });
      }
    }

    const successCount = recordResults.filter(r => r?.success).length;
    logger.info(`Processed ${recordResults.length} webhooks: ${successCount} successful, ${batchItemFailures.length} failed`);

    return { batchItemFailures };
  }
);