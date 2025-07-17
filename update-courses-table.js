// Script to add missing columns to courses table
import { db } from './server/db-drizzle.js';
import { sql } from 'drizzle-orm';

async function updateCoursesTable() {
  console.log('🔧 Adding missing columns to courses table...');
  
  try {
    // Set the search path to use the correct schema
    const schemaName = process.env.DB_SCHEMA || 'student_learning_hub';
    console.log(`Using database schema: ${schemaName}`);
    
    await db.execute(sql.raw(`SET search_path TO ${schemaName}, public`));
    
    // Add missing columns one by one
    const alterQueries = [
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS term_type VARCHAR(20) DEFAULT 'semester'`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_date DATE`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_date DATE`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS visibility course_visibility DEFAULT 'private'::course_visibility`,
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS grading_scheme grading_scheme DEFAULT 'letter'::grading_scheme`
    ];
    
    for (const query of alterQueries) {
      console.log(`   Executing: ${query}`);
      try {
        await db.execute(sql.raw(query));
        console.log(`   ✅ Success`);
      } catch (error) {
        console.log(`   ⚠️ ${error.message}`);
      }
    }
    
    console.log('✅ All missing columns added successfully');
    
  } catch (error) {
    console.error('❌ Error updating courses table:', error);
  }
}

updateCoursesTable().catch(console.error);