import { getClient } from "@webhooks/client"


export const getWebhookClient = async () => {
    const client = await getClient()

    // TODO JWT and base URL configuration
    client.defaults.baseURL = 'https://bz9mijh0hd.execute-api.eu-central-1.amazonaws.com';

    return client;
}