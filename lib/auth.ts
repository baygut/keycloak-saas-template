import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

const keycloakUrl = process.env.KEYCLOAK_URL;
const keycloakRealm = process.env.KEYCLOAK_REALM;
const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID;
const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

type KeycloakProviderConfig = {
  clientId: string;
  clientSecret?: string;
  issuer: string;
  authorization: {
    params: {
      scope: string;
    };
  };
};

const keycloakProvider = KeycloakProvider as unknown as (
  config: KeycloakProviderConfig,
) => ReturnType<typeof KeycloakProvider>;

if (!keycloakUrl || !keycloakRealm || !keycloakClientId) {
  throw new Error(
    "Missing required Keycloak or NextAuth environment variables.",
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    keycloakProvider({
      clientId: keycloakClientId,
      ...(keycloakClientSecret ? { clientSecret: keycloakClientSecret } : {}),
      issuer: `${keycloakUrl}/realms/${keycloakRealm}`,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      if (account?.id_token) {
        token.idToken = account.id_token;
      }

      if (profile?.sub) {
        token.sub = profile.sub;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }

      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.keycloakLogoutUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/logout`;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
