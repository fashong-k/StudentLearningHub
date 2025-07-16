#!/usr/bin/env node

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

const { Pool } = pg;

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

// Use local database configuration if DATABASE_URL is not set
let pool;
if (envVars.DATABASE_URL && envVars.DATABASE_URL !== '""') {
  pool = new Pool({ connectionString: envVars.DATABASE_URL });
} else {
  // Use local PostgreSQL configuration
  const connectionString = `postgresql://${envVars.DB_USER}:${envVars.DB_PASS}@${envVars.DB_HOST}:${envVars.DB_PORT}/${envVars.DB_NAME}`;
  pool = new Pool({ connectionString });
}

const db = drizzle({ client: pool });

async function seedDatabase() {
  try {
    console.log('Seeding database with sample data...');
    
    // Create users
    console.log('Creating users...');
    
    await db.execute(sql`
      INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
      VALUES 
        ('admin', 'admin@lms.local', 'System', 'Administrator', 'admin', NOW(), NOW()),
        ('teacher', 'teacher@lms.local', 'John', 'Teacher', 'teacher', NOW(), NOW()),
        ('student', 'student@lms.local', 'Jane', 'Student', 'student', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = NOW()
    `);
    
    // Create courses
    console.log('Creating courses...');
    
    await db.execute(sql`
      INSERT INTO courses (title, description, course_code, teacher_id, semester, year, is_active, created_at, updated_at)
      VALUES 
        ('Introduction to Computer Science', 'Basic concepts of programming and computer science', 'CS101', 'teacher', 'Fall', 2024, true, NOW(), NOW()),
        ('Advanced Mathematics', 'Calculus and advanced mathematical concepts', 'MATH201', 'teacher', 'Fall', 2024, true, NOW(), NOW()),
        ('Psychology Fundamentals', 'Introduction to psychological concepts and theories', 'PSYC101', 'teacher', 'Fall', 2024, true, NOW(), NOW())
      ON CONFLICT (course_code) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        teacher_id = EXCLUDED.teacher_id,
        semester = EXCLUDED.semester,
        year = EXCLUDED.year,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `);
    
    // Create enrollments
    console.log('Creating enrollments...');
    
    await db.execute(sql`
      INSERT INTO enrollments (student_id, course_id, enrolled_at)
      SELECT 'student', c.id, NOW()
      FROM courses c
      WHERE c.course_code IN ('CS101', 'MATH201', 'PSYC101')
      ON CONFLICT (student_id, course_id) DO NOTHING
    `);
    
    // Create assignments
    console.log('Creating assignments...');
    
    await db.execute(sql`
      INSERT INTO assignments (title, description, course_id, due_date, max_points, created_at, updated_at)
      SELECT 
        'Assignment 1',
        'First assignment for the course',
        c.id,
        NOW() + INTERVAL '7 days',
        100,
        NOW(),
        NOW()
      FROM courses c
      WHERE c.course_code IN ('CS101', 'MATH201', 'PSYC101')
      ON CONFLICT DO NOTHING
    `);
    
    // Create announcements
    console.log('Creating announcements...');
    
    await db.execute(sql`
      INSERT INTO announcements (title, content, course_id, created_by, created_at, updated_at)
      SELECT 
        'Welcome to the course!',
        'This is an announcement for the course.',
        c.id,
        'teacher',
        NOW(),
        NOW()
      FROM courses c
      WHERE c.course_code IN ('CS101', 'MATH201', 'PSYC101')
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();