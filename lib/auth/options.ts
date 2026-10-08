import type { BetterAuthOptions } from "better-auth";

export const MIN_PASSWORD_LENGTH = 8;

const trustedOrigins = [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL].filter(
  (origin): origin is string => Boolean(origin),
);

/**
 * Shared Better Auth options (everything except the database adapter and plugins),
 * so the seed script can build an identical instance outside of Next.js.
 */
export const authOptions = {
  appName: "Recruiter AI Co-Pilot",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    // Internal tool: accounts are provisioned by scripts/seed.ts only.
    disableSignUp: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: 128,
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: true,
        // Clients may not set this through Better Auth endpoints.
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh expiry daily
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/change-password": { window: 60, max: 10 },
    },
  },
} satisfies BetterAuthOptions;
