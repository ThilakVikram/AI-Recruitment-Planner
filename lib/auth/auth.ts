import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "./options";

export const auth = betterAuth({
  ...authOptions,
  database: prismaAdapter(prisma, { provider: "mysql" }),
  // nextCookies must be the last plugin so Server Actions can set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
