import { isHttpError } from "http-errors";
import { logger } from "@webhooks/common/powertools";
import type { Context } from "openapi-backend";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context as LambdaContext } from "aws-lambda";

export const handleErrors = (err: Error) => {
	if (isHttpError(err)) {
		// render http errors thrown by handler as JSON
		const { statusCode, message } = err;
		logger.info("done - http error", {
			statusCode,
			error: message,
		});

		return toApiResponse({ statusCode, body: { error: message } });
	}
	// log non-http errors thrown by handlers and return an opaque 500
	logger.error("Error", { error: err });

	return toApiResponse({
		statusCode: 500,
		body: { error: "Unknown API error" },
	});
};

export type HandlerParams = [Context, APIGatewayProxyEventV2?, LambdaContext?];

export type ApiHandler = (
	...params: HandlerParams
) => Promise<APIGatewayProxyStructuredResultV2>;

export const toApiResponse = (params: {
	body?: unknown;
	statusCode: number;
}): APIGatewayProxyStructuredResultV2 => {
	const defaultHeaders = {
		"content-type": "application/json",
		"cache-control": "no-cache,no-store,must-revalidate",
		expires: "0",
	};

	return {
		statusCode: params.statusCode,
		isBase64Encoded: false,
		headers: {
			...defaultHeaders,
		},
		...(params.body ? { body: JSON.stringify(params.body) } : {}),
	};
};