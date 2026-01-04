import {
    Entity,
} from "electrodb";
import { ddb } from "../aws-clients";

/**
 * Webhook entity - single table design
 * Query patterns:
 * 1. Get webhook by tenant + ID (PK: tenant_id, SK: webhook_id)
 * 2. List all webhooks for a tenant (PK: tenant_id)
 * 3. Get webhook by webhook_id only (GSI1: webhook_id) - optional for SQS consumer
 */
export const WebhookEntity = new Entity({
	model: {
		entity: "webhook",
		version: "1",
		service: "webhooks",
	},
	attributes: {
		tenant_id: { type: "string", required: true },
		webhook_id: { type: "string", required: true },
		name: { type: "string" },
        endpoint: { type: "string", required: true },
        secret: { type: "string", required: true }, // KMS encrypted
		event_types: { type: "set", items: "string", required: true }, // e.g., ['contact.created', 'email.sent']
		status: { type: ["enabled", "disabled"] as const, default: "enabled", required: true },
		created_at: { type: "string", required: true },
		created_by: { type: "string", required: true },
		updated_at: { type: "string" },
		updated_by: { type: "string" },
	},
	indexes: {
		primary: {
			pk: { field: "pk", composite: ["tenant_id"] },
			sk: { field: "sk", composite: ["webhook_id"] },
		},
        byWebhookId: {
            index: "gsi1",
            pk: { field: "gsi1pk", composite: ["webhook_id"] },
            sk: { field: "gsi1sk", composite: [] },
        },
	},
}, { client: ddb, table: process.env.WEBHOOKS_TABLE_NAME });
