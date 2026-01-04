import middy from "@middy/core";
import type {
	APIGatewayProxyEventV2,
	APIGatewayProxyStructuredResultV2,
	Context,
} from "aws-lambda";

export const withMiddlewares = (
	handler: (
		event: APIGatewayProxyEventV2,
		context: Context,
	) => Promise<APIGatewayProxyStructuredResultV2>,
) => {
	return middy(handler).use(withCors());
};

export const withCors = () => {
	return {
		before: (handler: middy.Request) => {
			const CORRELATION_HEADERS =
				"awsRequestId, x-correlation-id, call-chain-length, debug-log-enabled";

			const lambdaEvent = handler.event as APIGatewayProxyEventV2;
			const isPreflightRequest =
				lambdaEvent.requestContext.http.method.toLowerCase() === "options";
			if (isPreflightRequest) {
				return {
					statusCode: 200,
					headers: {
						"access-control-allow-origin":
							lambdaEvent.headers.Origin || lambdaEvent.headers.origin || "*",
						"access-control-allow-headers": `Authorization, Content-Type, x-ivy-org-id, x-epilot-org-id, ${CORRELATION_HEADERS}`,
						"access-control-allow-methods":
							"GET, POST, PATCH, PUT, DELETE, OPTIONS",
						"access-control-allow-credentials": "true",
					},
				} as APIGatewayProxyStructuredResultV2;
			}
		},
	};
};