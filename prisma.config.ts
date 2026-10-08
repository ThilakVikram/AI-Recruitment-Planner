import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // `prisma generate` does not need a live URL, so fall back to a placeholder at build time.
    url: process.env.DATABASE_URL ?? "mysql://placeholder@localhost:3306/placeholder",
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL || undefined,
  },
});
