import 'dotenv/config';
import { db } from './db';
import { sql } from 'kysely';
import fs from 'fs';
import path from 'path';

async function init() {
  console.log('🚀 Connecting to production Neon DB...');
  
  try {
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the large schema block
    await sql.raw(schemaSql).execute(db);

    console.log('✅ Schema applied successfully!');
  } catch (err) {
    console.error('❌ Failed to apply schema:', err);
  } finally {
    process.exit();
  }
}

init();
