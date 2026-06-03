export interface KeycloakResponse {
  ok: boolean;
  stage: string;
  query: Query;
  tokenResponse: TokenResponse;
}

export interface Query {
  state: string;
  session_state: string;
  iss: string;
  code: string;
}

export interface TokenResponse {
  ok: boolean;
  status: number;
  tokenEndpoint: string;
  payload: Payload;
}

export interface Payload {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  "not-before-policy": number;
  session_state: string;
  scope: string;
}
