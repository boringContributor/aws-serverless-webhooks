import { randomUUID } from "node:crypto"
import { CreateEventItem, WebhookEntity, WebhookEvent } from "./index.db"
import { Webhook } from 'standardwebhooks'
import { generateWebhookSecret, encryptSecret, decryptSecret } from './kms'
import { sqs } from "../aws-clients"

export const createWebhook = async (params: {
    tenant_id: string,
    endpoint: string,
    event_types: string[],
    name?: string,
    created_by: string
}) => {
    const webhook_id = randomUUID();
    const plaintextSecret = generateWebhookSecret();

    const kmsKeyId = process.env.WEBHOOK_SECRET_KMS_KEY_ID;
    if (!kmsKeyId) {
        throw new Error('WEBHOOK_SECRET_KMS_KEY_ID environment variable is not set');
    }

    const encryptedSecret = await encryptSecret(plaintextSecret, kmsKeyId);

    const webhook = await WebhookEntity.create({
        tenant_id: params.tenant_id,
        webhook_id: webhook_id,
        endpoint: params.endpoint,
        event_types: params.event_types,
        name: params.name,
        secret: encryptedSecret,
        status: 'enabled',
        created_at: new Date().toISOString(),
        created_by: params.created_by
    }).go()

    // Return the webhook with plaintext secret (only time it's returned unencrypted)
    return {
        ...webhook,
        data: webhook.data ? {
            ...webhook.data,
            secret: plaintextSecret
        } : undefined
    };
}

export const getWebhook = async (params: {
    tenant_id: string,
    webhook_id: string
}) => {
    const result = await WebhookEntity.get({
        tenant_id: params.tenant_id,
        webhook_id: params.webhook_id
    }).go()

    if (result.data && result.data.secret) {
        const decryptedSecret = await decryptSecret(result.data.secret);
        return {
            ...result,
            data: result.data ? {
                ...result.data,
                secret: decryptedSecret
            } : undefined
        }
    }

    return result;
}

export const listWebhooks = async (params: { tenant_id: string }) => {
    return await WebhookEntity.query.primary({
        tenant_id: params.tenant_id
    }).go();
}

export const updateWebhook = async (params: {
    tenant_id: string,
    webhook_id: string,
    name?: string,
    endpoint?: string,
    event_types?: string[],
    status?: 'enabled' | 'disabled',
    updated_by: string
}) => {
    const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
        updated_by: params.updated_by
    }

    if (params.name !== undefined) updateData.name = params.name;
    if (params.endpoint !== undefined) updateData.endpoint = params.endpoint;
    if (params.event_types !== undefined) updateData.event_types = params.event_types;
    if (params.status !== undefined) updateData.status = params.status;

    return await WebhookEntity.update({
        tenant_id: params.tenant_id,
        webhook_id: params.webhook_id
    }).set(updateData).go()
}

export const deleteWebhook = async (params: {
    tenant_id: string,
    webhook_id: string
}) => {
    return await WebhookEntity.delete({
        tenant_id: params.tenant_id,
        webhook_id: params.webhook_id
    }).go();
}

export const rotateWebhookSecret = async (params: {
    tenant_id: string,
    webhook_id: string,
    updated_by: string
}) => {
    const plaintextSecret = generateWebhookSecret();

    const kmsKeyId = process.env.WEBHOOK_SECRET_KMS_KEY_ID;
    if (!kmsKeyId) {
        throw new Error('WEBHOOK_SECRET_KMS_KEY_ID environment variable is not set');
    }

    const encryptedSecret = await encryptSecret(plaintextSecret, kmsKeyId);

    await WebhookEntity.update({
        tenant_id: params.tenant_id,
        webhook_id: params.webhook_id
    }).set({
        secret: encryptedSecret,
        updated_at: new Date().toISOString(),
        updated_by: params.updated_by
    }).go();

    return {
        webhook_id: params.webhook_id,
        secret: plaintextSecret,
        rotated_at: new Date().toISOString()
    };
}

export const dispatchWebhookDeliveries = async (params: {
    event_type: string,
    data: unknown,
    tenant_id: string
}) => {
    const webhooks = await WebhookEntity.query.primary({
        tenant_id: params.tenant_id
    }).where(
        ({ status, event_types }, { eq, contains }) => `${eq(status, 'enabled')} AND ${contains(event_types, params.event_type)}`,
    ).go();

    if (!webhooks.data || webhooks.data.length === 0) {
        return { enqueued: 0, webhook_ids: [] };
    }

    const queueUrl = process.env.WEBHOOK_DELIVERY_QUEUE_URL;
    if (!queueUrl) {
        throw new Error('WEBHOOK_DELIVERY_QUEUE_URL environment variable is not set');
    }

    const successfulWebhookIds: string[] = [];

    for (let i = 0; i < webhooks.data.length; i += 10) {
        const batch = webhooks.data.slice(i, i + 10);

        const result = await sqs.sendMessageBatch({
            QueueUrl: queueUrl,
            Entries: batch.map((webhook, index) => ({
                Id: `${i + index}`,
                MessageBody: JSON.stringify({
                    webhook_id: webhook.webhook_id,
                    tenant_id: params.tenant_id,
                    event_type: params.event_type,
                    payload: params.data,
                })
            }))
        });

        if (result.Successful) {
            for(const success of result.Successful) {
                if (success.Id) {
                    const index = parseInt(success.Id);
                    successfulWebhookIds.push(webhooks.data[index].webhook_id);
                }
            }
        }
    }

    const result = {
        enqueued: successfulWebhookIds.length,
        webhook_ids: successfulWebhookIds
    };

    return result;
}

export const deliverWebhook = async (params: {
    tenant_id: string,
    webhook_id: string,
    event_type: string,
    event_data: unknown
}) => {
    const webhook = await WebhookEntity.get({
        tenant_id: params.tenant_id,
        webhook_id: params.webhook_id
    }).go();

    if (!webhook.data) {
        throw new Error(`Webhook ${params.webhook_id} not found`);
    }

    if (webhook.data.status !== 'enabled') {
        throw new Error(`Webhook ${params.webhook_id} is disabled`);
    }

    const decryptedSecret = await decryptSecret(webhook.data.secret);
    const wh = new Webhook(decryptedSecret);

    const timestamp = new Date();
    const msg_id = `msg_${randomUUID()}`;

    const payload = {
        type: params.event_type,
        timestamp,
        data: params.event_data
    };

    const signature = wh.sign(msg_id, timestamp, JSON.stringify(payload));

    const response = await fetch(webhook.data.endpoint, {
        method: 'POST',
        headers: {
            'webhook-id': msg_id,
            'webhook-timestamp': timestamp.toISOString(),
            'webhook-signature': signature,
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(
            `Webhook delivery failed: ${response.status} ${response.statusText}`
        );
    }

    // TODO check large response payloads
    return {
        webhook_id: params.webhook_id,
        message_id: msg_id,
        endpoint: webhook.data.endpoint,
        status: response.status,
        response_body: await response.text(),
        message_payload: payload.data
    };
}

export const recordDeliveryEvent = async (input: CreateEventItem) => {
    return WebhookEvent.create(input).go();
}

export const listEvents = async (params: {
    tenant_id: string,
    webhook_id: string,
    limit?: number,
    cursor?: string
}) => {
    const limit = params.limit || 20;

    const query = WebhookEvent.query.primary({
        tenant_id: params.tenant_id,
        webhook_id: params.webhook_id
    });

    const result = await query.go({
        limit,
        cursor: params.cursor || undefined
    });

    return {
        data: result.data || [],
        cursor: result.cursor || null
    };
}

export const getEventById = async (params: {
    tenant_id: string,
    webhook_id: string,
    event_id: string
}) => {
    return await WebhookEvent.get({
        tenant_id: params.tenant_id,
        webhook_id: params.webhook_id,
        event_id: params.event_id
    }).go();
}   