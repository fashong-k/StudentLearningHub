import { readFileSync } from 'fs';
import { join } from 'path';
import { db, dbSchema } from './db-drizzle';
import { sql } from 'drizzle-orm';

// Function to drop all tables in the configured schema
async function dropAllTables() {
  console.log(`🗑️ Dropping all existing tables in ${dbSchema} schema...`);
  
  const dropQueries = [
    `DROP TABLE IF EXISTS ${dbSchema}.sessions CASCADE;`,
    `DROP TABLE IF EXISTS ${dbSchema}.plagiarism_results CASCADE;`,
    `DROP TABLE IF EXISTS ${dbSchema}.discussion_replies CASCADE;`,
    `DROP TABLE IF EXISTS ${dbSchema}.discussions CASCADE;`,
    `DROP TABLE IF EXISTS ${dbSchema}.messages CASCADE;`,
    `DROP TABLE IF EXISTS ${dbSchema}.announcements CASCADE;`,
    `DROP TABLE IF EXISTS ${dbSchema}.submissions CASCADE;`,
    `DROP TABLE IF EXISTS ${dbSchema}.assignments CASCADE;`,
    `DROP TABLE IF EXISTS ${dbSchema}.enrollments CASCADE;`,
    `DROP TABLE IF EXISTS ${dbSchema}.courses CASCADE;`,
    `DROP TABLE IF EXISTS ${dbSchema}.users CASCADE;`,
    
    // Drop enum types
    `DROP TYPE IF EXISTS ${dbSchema}.user_role CASCADE;`,
    `DROP TYPE IF EXISTS ${dbSchema}.course_visibility CASCADE;`,
    `DROP TYPE IF EXISTS ${dbSchema}.grading_scheme CASCADE;`,
    `DROP TYPE IF EXISTS ${dbSchema}.assignment_status CASCADE;`,
    `DROP TYPE IF EXISTS ${dbSchema}.submission_status CASCADE;`,
    `DROP TYPE IF EXISTS ${dbSchema}.plagiarism_status CASCADE;`
  ];
  
  for (const query of dropQueries) {
    try {
      await db.execute(sql.raw(query));
    } catch (error) {
      // Ignore errors for non-existent tables/types
      console.log(`   ⚠️ ${query} - ${error.message}`);
    }
  }
  
  console.log('✅ All tables dropped successfully');
}

// Function to create all tables in the configured schema
async function createAllTables() {
  console.log(`🏗️ Creating all tables in ${dbSchema} schema...`);
  
  console.log(`Using database schema: ${dbSchema}`);
  
  // Create schema if it doesn't exist (raw SQL for schema creation)
  await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS ${dbSchema}`));
  await db.execute(sql.raw(`SET search_path TO ${dbSchema}, public`));
  
  // Create enums first
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE course_visibility AS ENUM ('private', 'institution');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE grading_scheme AS ENUM ('letter', 'percentage', 'points');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'archived');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'returned');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE plagiarism_status AS ENUM ('pending', 'clear', 'flagged');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  // Create users table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY,
      email VARCHAR UNIQUE,
      first_name VARCHAR,
      last_name VARCHAR,
      role user_role NOT NULL DEFAULT 'student'::user_role,
      profile_image_url VARCHAR,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  // Create courses table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      course_code VARCHAR(20) UNIQUE NOT NULL,
      description TEXT,
      teacher_id VARCHAR NOT NULL,
      semester VARCHAR(20),
      year INTEGER,
      term_type VARCHAR(20) DEFAULT 'semester',
      start_date DATE,
      end_date DATE,
      visibility course_visibility DEFAULT 'private'::course_visibility,
      grading_scheme grading_scheme DEFAULT 'letter'::grading_scheme,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  
  // Create enrollments table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS enrollments (
      id SERIAL PRIMARY KEY,
      student_id VARCHAR NOT NULL,
      course_id INTEGER NOT NULL,
      enrolled_at TIMESTAMP DEFAULT NOW(),
      is_active BOOLEAN DEFAULT true,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id)
    );
  `);
  
  // Create assignments table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date TIMESTAMP,
      max_points DECIMAL(10,2),
      assignment_type VARCHAR(50) DEFAULT 'homework',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `);
  
  // Create submissions table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      assignment_id INTEGER NOT NULL,
      student_id VARCHAR NOT NULL,
      submission_text TEXT,
      file_path VARCHAR,
      submitted_at TIMESTAMP DEFAULT NOW(),
      grade DECIMAL(10,2),
      feedback TEXT,
      graded_at TIMESTAMP,
      is_late BOOLEAN DEFAULT false,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  
  // Create announcements table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      author_id VARCHAR NOT NULL,
      is_important BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  
  // Create messages table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id VARCHAR NOT NULL,
      receiver_id VARCHAR NOT NULL,
      course_id INTEGER,
      subject VARCHAR(255),
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      sent_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
    );
  `);
  
  // Create discussions table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS discussions (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      author_id VARCHAR NOT NULL,
      is_pinned BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  
  // Create discussion_replies table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS discussion_replies (
      id SERIAL PRIMARY KEY,
      discussion_id INTEGER NOT NULL,
      author_id VARCHAR NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE
    );
  `);
  
  // Create plagiarism_results table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS plagiarism_results (
      id SERIAL PRIMARY KEY,
      submission_id INTEGER NOT NULL,
      similarity_score DECIMAL(5,2),
      status plagiarism_status DEFAULT 'pending'::plagiarism_status,
      results_data JSONB,
      checked_by VARCHAR,
      checked_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );
  `);
  
  // Create sessions table for authentication
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMP NOT NULL
    );
  `);
  
  // Create index on sessions expire column
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
  `);
  
  console.log('✅ All tables created successfully');
}

export async function initializeDatabase() {
  console.log('Initializing database tables...');
  
  // Load environment variables if not already loaded
  if (!process.env.DB_SCHEMA) {
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
      console.log('Could not load .env file for database initialization');
    }
  }
  
  try {
    // Check if we should reinitialize the database
    console.log('Debug: DB_INIT environment variable:', process.env.DB_INIT);
    if (process.env.DB_INIT === 'true') {
      console.log('🌱 DB_INIT=true detected. Dropping all existing tables and recreating...');
      try {
        // Drop all tables in student_learning_hub schema
        await dropAllTables();
        
        // Recreate all tables
        await createAllTables();
        
        // Seed with fresh data
        console.log('🌱 Starting comprehensive data seeding...');
        const { seedAllData } = await import('./seedData-drizzle');
        await seedAllData();
      } catch (error) {
        console.error('❌ Error during database reinitialization:', error);
      }
    } else {
      console.log('🚫 DB_INIT not set to true, using normal table creation');
      // Normal table creation for production/development
      await createAllTables();
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}