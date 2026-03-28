import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const dialect = new PostgresDialect({
  pool,
});

// Database interface based on types
export const db = new Kysely<Database>({
  dialect,
});
