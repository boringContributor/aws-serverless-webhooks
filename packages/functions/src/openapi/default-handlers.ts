import { ApiHandler, toApiResponse } from "./utils";

export const notFound: ApiHandler = async () => {
	return toApiResponse({ statusCode: 404 });
};

export const validationFail: ApiHandler = async (c) => {
	return toApiResponse({ statusCode: 400, body: { err: c.validation.errors } });
};

export const notImplemented: ApiHandler = async (c) => {
	return toApiResponse({ statusCode: 501 });
};

export const unauthorizedHandler: ApiHandler = async () => {
	return toApiResponse({ statusCode: 401 });
};
