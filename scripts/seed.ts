/**
 * Seeds the four initial HR/recruiter accounts.
 *
 *   npm run db:seed
 *
 * - Idempotent: existing emails are skipped (never duplicated or reset).
 * - Passwords are random, hashed by Better Auth's own password hasher and stored
 *   via Better Auth's internal adapter as a "credential" account — the same steps
 *   Better Auth's email sign-up performs (public sign-up is disabled for this app).
 * - Each new user gets mustChangePassword = true.
 * - Temporary passwords are printed once to stdout and stored nowhere else.
 *
 * Override the default emails with SEED_USERS="Name <email>, Name <email>, ...".
 */
import "dotenv/config";
import { randomInt } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../lib/generated/prisma/client";
import { authOptions } from "../lib/auth/options";

const DEFAULT_USERS = [
  { name: "Recruiter 1", email: "recruiter1@company.com" },
  { name: "Recruiter 2", email: "recruiter2@company.com" },
  { name: "Recruiter 3", email: "recruiter3@company.com" },
  { name: "Recruiter 4", email: "recruiter4@company.com" },
];

function parseSeedUsers(value: string | undefined) {
  if (!value?.trim()) return DEFAULT_USERS;
  const users = value.split(",").map((entry) => {
    const match = entry.trim().match(/^(.*?)\s*<([^>]+)>$/);
    const email = (match ? match[2] : entry).trim().toLowerCase();
    const name = (match ? match[1] : email.split("@")[0]).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`Invalid email in SEED_USERS: ${entry}`);
    return { name, email };
  });
  if (users.length !== 4) throw new Error(`SEED_USERS must list exactly 4 users (got ${users.length}).`);
  return users;
}

/** 16 chars from an unambiguous alphabet, guaranteed to include each character class. */
function generateTemporaryPassword(): string {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%*?-_"];
  const all = sets.join("");
  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < 16) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  if (!process.env.BETTER_AUTH_SECRET) throw new Error("BETTER_AUTH_SECRET is not set.");

  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL) });
  const auth = betterAuth({ ...authOptions, database: prismaAdapter(prisma, { provider: "mysql" }) });
  const ctx = await auth.$context;

  const users = parseSeedUsers(process.env.SEED_USERS);
  let created = 0;

  try {
    for (const { name, email } of users) {
      const existing = await ctx.internalAdapter.findUserByEmail(email);
      if (existing) {
        console.log(`Skipped (already exists): ${email}`);
        continue;
      }

      const password = generateTemporaryPassword();
      const hash = await ctx.password.hash(password);
      const user = await ctx.internalAdapter.createUser(
        {
          name,
          email,
          emailVerified: true,
          mustChangePassword: true,
        },
        { method: "email-password" },
      );
      await ctx.internalAdapter.linkAccount({
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hash,
      });
      // Defensive: make sure the flag is set even if an adapter ignores additional fields.
      await prisma.user.update({ where: { id: user.id }, data: { mustChangePassword: true } });

      created++;
      console.log(`\nUser created\n\nEmail:\n${email}\n\nTemporary password:\n${password}\n`);
    }
    console.log(`\nDone. ${created} user(s) created, ${users.length - created} already existed.`);
    if (created) console.log("Share each temporary password securely. Users must change it at first login.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
