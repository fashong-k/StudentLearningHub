#!/usr/bin/env node

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import { readFileSync } from 'fs';
import { join } from 'path';

neonConfig.webSocketConstructor = ws;

// Load environment variables
const envPath = join(process.cwd(), '.env');
let envContent;
try {
  envContent = readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('Error reading .env file:', error.message);
  process.exit(1);
}

const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

if (!envVars.DATABASE_URL) {
  console.error('DATABASE_URL not found in .env file');
  process.exit(1);
}

const pool = new Pool({ connectionString: envVars.DATABASE_URL });
const db = drizzle({ client: pool });

async function updateSchema() {
  try {
    console.log('Updating database schema...');
    
    // Add missing columns to courses table
    console.log('Adding missing columns to courses table...');
    
    try {
      await db.execute(sql`ALTER TABLE courses ADD COLUMN term_type VARCHAR(20) DEFAULT 'semester'`);
      console.log('✓ Added term_type column');
    } catch (error) {
      if (error.code !== '42701') { // Column already exists
        console.log('term_type column might already exist:', error.message);
      }
    }

    try {
      await db.execute(sql`ALTER TABLE courses ADD COLUMN start_date TIMESTAMP`);
      console.log('✓ Added start_date column');
    } catch (error) {
      if (error.code !== '42701') {
        console.log('start_date column might already exist:', error.message);
      }
    }

    try {
      await db.execute(sql`ALTER TABLE courses ADD COLUMN end_date TIMESTAMP`);
      console.log('✓ Added end_date column');
    } catch (error) {
      if (error.code !== '42701') {
        console.log('end_date column might already exist:', error.message);
      }
    }

    try {
      await db.execute(sql`ALTER TABLE courses ADD COLUMN visibility VARCHAR(20) DEFAULT 'private'`);
      console.log('✓ Added visibility column');
    } catch (error) {
      if (error.code !== '42701') {
        console.log('visibility column might already exist:', error.message);
      }
    }

    try {
      await db.execute(sql`ALTER TABLE courses ADD COLUMN grading_scheme VARCHAR(20) DEFAULT 'letter'`);
      console.log('✓ Added grading_scheme column');
    } catch (error) {
      if (error.code !== '42701') {
        console.log('grading_scheme column might already exist:', error.message);
      }
    }

    // Update assignments table
    console.log('Updating assignments table...');
    
    try {
      await db.execute(sql`ALTER TABLE assignments ALTER COLUMN max_points TYPE DECIMAL(10,2)`);
      console.log('✓ Updated max_points column type');
    } catch (error) {
      console.log('max_points column type might already be correct:', error.message);
    }

    // Update submissions table
    console.log('Updating submissions table...');
    
    try {
      await db.execute(sql`ALTER TABLE submissions ALTER COLUMN grade TYPE DECIMAL(10,2)`);
      console.log('✓ Updated grade column type');
    } catch (error) {
      console.log('grade column type might already be correct:', error.message);
    }

    console.log('✅ Schema update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
  }
}

updateSchema();