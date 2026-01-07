import type {
	APIGatewayProxyEventV2,
	APIGatewayProxyStructuredResultV2,
	Context,
} from "aws-lambda";
import type { Request } from "openapi-backend";
import { withMiddlewares } from "./middleware";
import { createAPI } from "./openapi";
import { logger } from "@webhooks/common/powertools";
import { handleErrors } from "./openapi/utils";

const headers = {
	"content-type": "application/json",
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
	"access-control-allow-headers": "content-type, authorization, x-api-key",
};
import openApiYml from '../openapi.yml';

const api = createAPI(openApiYml);

api.register({
	createWebhookConfig: async (...params) =>
    (await import('./api')).createWebhookConfig(...params),
	deleteWebhookConfig: async (...params) =>
	(await import('./api')).deleteWebhookConfig(...params),
	getWebhookConfig: async (...params) =>
		(await import('./api')).getWebhookConfig(...params),
	listWebhooks: async (...params) =>
		(await import('./api')).listWebhookConfigs(...params),
	dispatchWebhook: async (...params) =>
		(await import('./api')).dispatchWebhook(...params),
	updateWebhookConfig: async (...params) =>
		(await import('./api')).updateWebhookConfig(...params),
	rotateWebhookSecret: async (...params) =>
		(await import('./api')).rotateWebhookSecret(...params),
	listEvents: async (...params) =>
		(await import('./api')).listEvents(...params),
	getEventById: async (...params) =>
		(await import('./api')).getEventById(...params),
});

api.init();

export const apiHandler = async (
	event: APIGatewayProxyEventV2,
	context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
	if (event.rawPath === "/openapi.json") {
		return {
			statusCode: 200,
			body: JSON.stringify('definition'),
			headers,
		};
	}

	logger.debug("API Handler", { event, context });

	return await api
		.handleRequest(
			{
				method: event.requestContext.http.method,
				path: event.rawPath,
				query: event.rawQueryString,
				body: event.body,
				headers: event.headers as Request["headers"],
			},
			event,
			context,
		)
		.catch(handleErrors);
};

export const handler = withMiddlewares(apiHandler);
