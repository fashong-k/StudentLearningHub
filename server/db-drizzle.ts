import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

// Load environment variables manually if needed
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !process.env[key]) {
        process.env[key] = value.trim();
      }
    });
  } catch (error) {
    console.log('Could not load .env file, using existing environment variables');
  }
}

let db: any;

if (process.env.DATABASE_URL) {
  // Use Neon serverless for production
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else if (process.env.DB_HOST) {
  // Use local PostgreSQL for development
  const pool = new NodePool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: false,
  });
  db = drizzleNode(pool, { schema });
} else {
  throw new Error(
    "Either DATABASE_URL or local database configuration (DB_HOST, DB_USER, etc.) must be set"
  );
}

export { db };