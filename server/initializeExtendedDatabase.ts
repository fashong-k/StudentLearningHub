import { db } from './db-drizzle';
import { sql } from 'drizzle-orm';
import { seedExtendedData, createValidationScenarioData } from './extendedSeedData';

// Create all extended tables for course update validation system
export async function initializeExtendedDatabase() {
  console.log('🚀 Initializing Extended Database for Course Update Validation...');
  
  try {
    // Create the extended schema with all tables
    await db.execute(sql`
      -- Create schema if it doesn't exist
      CREATE SCHEMA IF NOT EXISTS student_learning_hub;
      
      -- Set search path to use the custom schema
      SET search_path TO student_learning_hub;
      
      -- Create all required enum types for extended tables
      DO $$ BEGIN
        CREATE TYPE event_type AS ENUM ('assignment_due', 'exam', 'lecture', 'lab', 'discussion', 'holiday');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE quiz_type AS ENUM ('practice', 'graded', 'midterm', 'final');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Create file_type enum if it doesn't exist
      DO $$ BEGIN
        CREATE TYPE file_type AS ENUM ('assignment', 'submission', 'course_material', 'profile_image', 'announcement');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Create notification_type enum if it doesn't exist
      DO $$ BEGIN
        CREATE TYPE notification_type AS ENUM ('assignment_due', 'grade_posted', 'announcement', 'message', 'discussion_reply');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Create attendance_status enum if it doesn't exist
      DO $$ BEGIN
        CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'tardy', 'excused');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Create Calendar Events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        event_type event_type DEFAULT 'lecture',
        location VARCHAR(255),
        is_recurring BOOLEAN DEFAULT FALSE,
        recurrence_pattern VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );
    `);
    
    // Create Quizzes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        quiz_type quiz_type DEFAULT 'practice',
        max_points DECIMAL(10, 2) DEFAULT 0,
        time_limit INTEGER,
        attempts_allowed INTEGER DEFAULT 1,
        due_date TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );
    `);
    
    // Create Quiz Questions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) DEFAULT 'multiple_choice',
        points DECIMAL(5, 2) DEFAULT 1,
        correct_answer TEXT,
        answer_options JSON,
        question_order INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      );
    `);
    
    // Create Quiz Attempts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL,
        student_id VARCHAR(50) NOT NULL,
        attempt_number INTEGER DEFAULT 1,
        score DECIMAL(5, 2) DEFAULT 0,
        max_score DECIMAL(5, 2) DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        time_spent INTEGER,
        answers JSON,
        is_completed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    
    // Create Grade Book table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS grade_book (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        student_id VARCHAR(50) NOT NULL,
        assignment_id INTEGER,
        quiz_id INTEGER,
        category VARCHAR(100),
        item_name VARCHAR(255) NOT NULL,
        points_earned DECIMAL(10, 2) DEFAULT 0,
        points_possible DECIMAL(10, 2) DEFAULT 0,
        percentage DECIMAL(5, 2),
        letter_grade VARCHAR(2),
        graded_at TIMESTAMP,
        graded_by VARCHAR(50),
        comments TEXT,
        is_excused BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    
    // Create Course Instructors table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS course_instructors (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        instructor_id VARCHAR(50) NOT NULL,
        role VARCHAR(50) DEFAULT 'instructor',
        permissions JSON,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    
    // Create Course Categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS course_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create Course Materials table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS course_materials (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(500),
        file_type file_type DEFAULT 'course_material',
        file_size INTEGER,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by VARCHAR(50),
        is_visible BOOLEAN DEFAULT TRUE,
        download_count INTEGER DEFAULT 0,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    
    // Create Course Schedules table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS course_schedules (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        location VARCHAR(255),
        schedule_type VARCHAR(50) DEFAULT 'lecture',
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );
    `);
    
    // Create Assignment Rubrics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assignment_rubrics (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL,
        criterion_name VARCHAR(255) NOT NULL,
        criterion_description TEXT,
        points_possible DECIMAL(5, 2) NOT NULL,
        performance_levels JSON,
        weight_percentage DECIMAL(5, 2) DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
      );
    `);
    
    // Create Attendance table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        student_id VARCHAR(50) NOT NULL,
        class_date DATE NOT NULL,
        status attendance_status DEFAULT 'present',
        notes TEXT,
        recorded_by VARCHAR(50),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    
    // Create File Uploads table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id SERIAL PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        stored_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type file_type NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type VARCHAR(100),
        uploaded_by VARCHAR(50),
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        course_id INTEGER,
        assignment_id INTEGER,
        is_public BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
      );
    `);
    
    // Create Notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        recipient_id VARCHAR(50) NOT NULL,
        sender_id VARCHAR(50),
        course_id INTEGER,
        notification_type notification_type NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_dismissed BOOLEAN DEFAULT FALSE,
        action_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );
    `);
    
    // Create User Preferences table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        preference_key VARCHAR(100) NOT NULL,
        preference_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (user_id, preference_key)
      );
    `);
    
    // Create System Logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100),
        record_id VARCHAR(50),
        old_values JSON,
        new_values JSON,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    
    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_calendar_events_course_id ON calendar_events(course_id);
      CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
      CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
      CREATE INDEX IF NOT EXISTS idx_quizzes_due_date ON quizzes(due_date);
      CREATE INDEX IF NOT EXISTS idx_grade_book_course_id ON grade_book(course_id);
      CREATE INDEX IF NOT EXISTS idx_grade_book_student_id ON grade_book(student_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_attendance_course_student ON attendance(course_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_file_uploads_course_id ON file_uploads(course_id);
    `);
    
    console.log('✅ Extended database tables created successfully');
    
    // Now seed the extended data
    await seedExtendedData();
    
    // Create validation scenario data
    await createValidationScenarioData();
    
    console.log('🎉 Extended database initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing extended database:', error);
    throw error;
  }
}

// Function to seed comprehensive sample data for all new tables
export async function seedExtendedTableData() {
  console.log('🌱 Seeding sample data for all extended tables...');
  
  try {
    // Seed Calendar Events
    await db.execute(sql`
      INSERT INTO calendar_events (course_id, title, description, start_date, end_date, event_type, location, is_recurring)
      SELECT 
        id,
        'Weekly Lecture',
        'Regular course lecture',
        '2025-01-15 09:00:00',
        '2025-01-15 10:30:00',
        'lecture',
        'Room 101',
        true
      FROM courses
      WHERE is_active = true
      ON CONFLICT DO NOTHING;
    `);
    
    // Seed Quizzes
    await db.execute(sql`
      INSERT INTO quizzes (course_id, title, description, quiz_type, max_points, time_limit, due_date)
      SELECT 
        id,
        'Chapter 1 Quiz',
        'Quiz covering chapter 1 materials',
        'graded',
        50,
        30,
        '2025-02-01 23:59:59'
      FROM courses
      WHERE is_active = true
      ON CONFLICT DO NOTHING;
    `);
    
    // Seed Course Categories
    await db.execute(sql`
      INSERT INTO course_categories (name, description, color)
      VALUES 
        ('Computer Science', 'Programming and software development courses', '#3b82f6'),
        ('Mathematics', 'Mathematical and statistical courses', '#10b981'),
        ('Psychology', 'Psychology and behavioral science courses', '#8b5cf6'),
        ('Business', 'Business and management courses', '#f59e0b'),
        ('Engineering', 'Engineering and technical courses', '#ef4444')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Seed Course Schedules
    await db.execute(sql`
      INSERT INTO course_schedules (course_id, day_of_week, start_time, end_time, location, schedule_type)
      SELECT 
        id,
        1, -- Monday
        '09:00:00',
        '10:30:00',
        'Room 101',
        'lecture'
      FROM courses
      WHERE is_active = true
      ON CONFLICT DO NOTHING;
    `);
    
    // Seed Course Instructors
    await db.execute(sql`
      INSERT INTO course_instructors (course_id, instructor_id, role, permissions)
      SELECT 
        id,
        teacher_id,
        'instructor',
        '{"can_grade": true, "can_post_announcements": true, "can_manage_enrollments": true}'
      FROM courses
      WHERE is_active = true
      ON CONFLICT DO NOTHING;
    `);
    
    // Seed User Preferences
    await db.execute(sql`
      INSERT INTO user_preferences (user_id, preference_key, preference_value)
      SELECT 
        id,
        'email_notifications',
        'true'
      FROM users
      ON CONFLICT (user_id, preference_key) DO NOTHING;
    `);
    
    // Seed Notifications
    await db.execute(sql`
      INSERT INTO notifications (recipient_id, sender_id, course_id, notification_type, title, message)
      SELECT 
        e.student_id,
        c.teacher_id,
        c.id,
        'announcement',
        'Welcome to ' || c.title,
        'Welcome to the course! Please review the syllabus and course materials.'
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.is_active = true
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ Sample data seeded for all extended tables');
    
  } catch (error) {
    console.error('❌ Error seeding extended table data:', error);
    throw error;
  }
}

export default initializeExtendedDatabase;