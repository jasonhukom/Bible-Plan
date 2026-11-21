import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";
import { authPool, migrateGuestData } from "./db.js";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured`);
  return value;
};

export const auth = betterAuth({
  database: authPool,
  secret: required("BETTER_AUTH_SECRET"),
  baseURL: required("BETTER_AUTH_URL"),
  advanced: { database: { generateId: "uuid" } },
  user: {
    modelName: "users",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
      isAnonymous: "is_anonymous",
    },
  },
  session: {
    modelName: "sessions",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
    },
  },
  account: {
    modelName: "accounts",
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  socialProviders: {
    google: {
      clientId: required("GOOGLE_OAUTH_KEY"),
      clientSecret: required("GOOGLE_OAUTH_SECRET"),
    },
  },
  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await migrateGuestData(anonymousUser.id, newUser.id);
      },
    }),
  ],
});
