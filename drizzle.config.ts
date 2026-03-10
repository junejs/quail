import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql', // Default to PostgreSQL for PGlite compatibility
  dbCredentials: {
    url: process.env.DATABASE_URL || './quail-db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
