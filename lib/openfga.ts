// lib/openfga.ts
import { OpenFgaClient } from "@openfga/sdk";

export const fga = new OpenFgaClient({
  apiUrl: "http://localhost:8081",
});
