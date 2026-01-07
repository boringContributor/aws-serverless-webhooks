import {
    Entity,
	CreateEntityItem
} from "electrodb";
import { ddb } from "../aws-clients";
import { randomUUID } from "node:crypto";

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

export const WebhookEvent = new Entity({
	model: {
		entity: "webhookEvent",
		version: "1",
		service: "webhooks",
	},
	attributes: {
		tenant_id: { type: "string", required: true },
		webhook_id: { type: "string", required: true },
		event_id: { type: "string", required: true, default: () => randomUUID() }, // Unique ID for this delivery event
		message_id: { type: "string", required: true }, // The webhook message ID (msg_xxx)
		event_type: { type: "string", required: true }, // e.g., 'contact.created', 'email.sent'
		http_status_code: { type: "number" }, // HTTP response status code
		attempts: { type: "number", default: 1, required: true }, // Number of delivery attempts
		status: { type: ["success", "failure", "pending"] as const, required: true },
		response_body: { type: "string" }, // HTTP response body (truncated if needed)
		message_payload: { type: "any", required: true }, // The actual webhook payload that was sent
		error_message: { type: "string" }, // Error message if delivery failed
		created_at: { type: "string", required: true, default: () => new Date().toISOString() }, // When the event was created
	},
	indexes: {
		primary: {
			pk: { field: "pk", composite: ["tenant_id", "webhook_id"] },
			sk: { field: "sk", composite: ["event_id"] },
		},
		byEventId: {
			index: "gsi1",
			pk: { field: "gsi1pk", composite: ["event_id"] },
			sk: { field: "gsi1sk", composite: ["created_at"] },
		},
	},
}, { client: ddb, table: process.env.WEBHOOK_EVENTS_TABLE_NAME });

export type CreateEventItem = CreateEntityItem<typeof WebhookEvent>;