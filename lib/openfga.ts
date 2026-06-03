import { OpenFgaClient } from "@openfga/sdk";

function getApiUrl(): string {
  return process.env.OPENFGA_API_URL ?? "http://localhost:8081";
}

export function isOpenFgaConfigured(): boolean {
  return Boolean(process.env.OPENFGA_STORE_ID?.trim());
}

let client: OpenFgaClient | null = null;

export function getOpenFgaClient(): OpenFgaClient {
  if (!client) {
    client = new OpenFgaClient({
      apiUrl: getApiUrl(),
      storeId: process.env.OPENFGA_STORE_ID,
      authorizationModelId: process.env.OPENFGA_AUTHORIZATION_MODEL_ID,
    });
  }
  return client;
}
