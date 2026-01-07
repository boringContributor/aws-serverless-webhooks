import { OpenAPIClientAxios } from 'openapi-client-axios';

import definition from './definition';
import { Client } from './openapi';

let clientPromise: Promise<Client> | null = null;

export const getClient = async (): Promise<Client> => {
  if (!clientPromise) {
    clientPromise = createClient();
  }

  return clientPromise;
};

export const createClient = async (): Promise<Client> => {
  try {
    console.log('Creating OpenAPI client with definition:', definition);
    const api = new OpenAPIClientAxios({ definition });
    console.log('OpenAPIClientAxios instance created, initializing...');
    const apiClient = await api.init<Client>();
    console.log('API client initialized successfully:', apiClient);

    apiClient.defaults.headers.common = {
      ...(apiClient.defaults.headers.common ?? {}),
    };

    return apiClient;
  } catch (error) {
    console.error('Failed to create API client:', error);
    throw error;
  }
};
