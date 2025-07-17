// Test database connection and schema
import { db } from './server/db-drizzle.js';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test the search path
    const searchPath = await db.execute(sql`SHOW search_path`);
    console.log('Current search path:', searchPath.rows[0].search_path);
    
    // Try to query the courses table
    const courses = await db.execute(sql`SELECT * FROM courses LIMIT 1`);
    console.log('Courses query result:', courses.rows);
    
    // Check if the columns exist
    const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name IN ('term_type', 'visibility', 'grading_scheme')
    `);
    console.log('Available columns:', columns.rows.map(r => r.column_name));
    
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

testConnection().catch(console.error);