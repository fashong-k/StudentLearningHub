import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './db-drizzle';
import { sql } from 'drizzle-orm';

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
    // Debug environment variables
    console.log('DB_SCHEMA env var:', process.env.DB_SCHEMA);
    console.log('All DB env vars:', {
      DB_HOST: process.env.DB_HOST,
      DB_NAME: process.env.DB_NAME,
      DB_SCHEMA: process.env.DB_SCHEMA
    });
    
    // Set the search path to use the correct schema
    const schemaName = process.env.DB_SCHEMA || 'public';
    console.log(`Using database schema: ${schemaName}`);
    
    // Create schema if it doesn't exist (raw SQL for schema creation)
    await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`));
    await db.execute(sql.raw(`SET search_path TO ${schemaName}, public`));
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
        CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'graded', 'returned');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE plagiarism_status AS ENUM ('pending', 'processing', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Create sessions table for authentication
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        role user_role DEFAULT 'student'::user_role NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create courses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        course_code VARCHAR(20) NOT NULL UNIQUE,
        teacher_id VARCHAR NOT NULL,
        semester VARCHAR(50),
        year INTEGER,
        term_type VARCHAR(20) DEFAULT 'semester',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        visibility course_visibility DEFAULT 'private'::course_visibility,
        grading_scheme grading_scheme DEFAULT 'letter'::grading_scheme,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
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
        max_points DECIMAL(10,2) DEFAULT 100.00,
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
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
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
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );
    `);
    
    // Create messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR NOT NULL,
        receiver_id VARCHAR NOT NULL,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        sent_at TIMESTAMP DEFAULT NOW()
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
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
    
    console.log('✓ Database tables initialized successfully');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}