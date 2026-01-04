import { OpenAPIBackend } from "openapi-backend";
import * as defaultHandlers from "./default-handlers";

export const createAPI = (definition: string) => {
	const api = new OpenAPIBackend({
		definition,
		quick: true,
	});

	api.register({ ...defaultHandlers });

	return api;
};
