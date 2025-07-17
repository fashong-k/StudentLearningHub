-- Extended Database Schema for Course Update Validation System
-- This includes all tables referenced in the course update validation system

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS student_learning_hub;

-- Set search path to use the custom schema
SET search_path TO student_learning_hub;

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE course_visibility AS ENUM ('private', 'institution');
CREATE TYPE grading_scheme AS ENUM ('letter', 'percentage', 'points');
CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'graded', 'returned');
CREATE TYPE file_type AS ENUM ('assignment', 'submission', 'course_material', 'profile_image', 'announcement');
CREATE TYPE notification_type AS ENUM ('assignment_due', 'grade_posted', 'announcement', 'message', 'discussion_reply');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'tardy', 'excused');
CREATE TYPE plagiarism_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE event_type AS ENUM ('assignment_due', 'exam', 'lecture', 'lab', 'discussion', 'holiday');
CREATE TYPE quiz_type AS ENUM ('practice', 'graded', 'midterm', 'final');

-- Extended tables for course update validation system

-- Calendar Events table
CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    event_type event_type DEFAULT 'lecture',
    location VARCHAR(255),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50), -- weekly, monthly, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Quizzes table
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quiz_type quiz_type DEFAULT 'practice',
    max_points DECIMAL(10, 2) DEFAULT 0,
    time_limit INTEGER, -- in minutes
    attempts_allowed INTEGER DEFAULT 1,
    due_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Quiz Questions table
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice', -- multiple_choice, true_false, short_answer, essay
    points DECIMAL(5, 2) DEFAULT 1,
    correct_answer TEXT,
    answer_options JSON, -- for multiple choice questions
    question_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Quiz Attempts table
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    score DECIMAL(5, 2) DEFAULT 0,
    max_score DECIMAL(5, 2) DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    time_spent INTEGER, -- in seconds
    answers JSON, -- student answers
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Grade Book table
CREATE TABLE grade_book (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    assignment_id INTEGER,
    quiz_id INTEGER,
    category VARCHAR(100), -- homework, quiz, exam, participation
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

-- Course Instructors table (for multiple instructors/TAs)
CREATE TABLE course_instructors (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    instructor_id VARCHAR(50) NOT NULL,
    role VARCHAR(50) DEFAULT 'instructor', -- instructor, ta, grader
    permissions JSON, -- specific permissions for this instructor
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course Categories table
CREATE TABLE course_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- hex color code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course Materials table
CREATE TABLE course_materials (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_type file_type DEFAULT 'course_material',
    file_size INTEGER, -- in bytes
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(50),
    is_visible BOOLEAN DEFAULT TRUE,
    download_count INTEGER DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Course Schedules table
CREATE TABLE course_schedules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    schedule_type VARCHAR(50) DEFAULT 'lecture', -- lecture, lab, discussion
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Assignment Rubrics table
CREATE TABLE assignment_rubrics (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL,
    criterion_name VARCHAR(255) NOT NULL,
    criterion_description TEXT,
    points_possible DECIMAL(5, 2) NOT NULL,
    performance_levels JSON, -- different performance levels and their descriptions
    weight_percentage DECIMAL(5, 2) DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

-- Attendance table
CREATE TABLE attendance (
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

-- File Uploads table (centralized file management)
CREATE TABLE file_uploads (
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

-- Notifications table
CREATE TABLE notifications (
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

-- User Preferences table
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, preference_key)
);

-- System Logs table (for audit trail)
CREATE TABLE system_logs (
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

-- Create indexes for better performance
CREATE INDEX idx_calendar_events_course_id ON calendar_events(course_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_quizzes_due_date ON quizzes(due_date);
CREATE INDEX idx_grade_book_course_id ON grade_book(course_id);
CREATE INDEX idx_grade_book_student_id ON grade_book(student_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX idx_attendance_course_student ON attendance(course_id, student_id);
CREATE INDEX idx_file_uploads_course_id ON file_uploads(course_id);