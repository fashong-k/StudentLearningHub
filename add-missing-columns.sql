-- Add missing columns to courses table
SET search_path TO student_learning_hub, public;

-- Add missing columns
ALTER TABLE courses ADD COLUMN IF NOT EXISTS term_type VARCHAR(20) DEFAULT 'semester';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS visibility course_visibility DEFAULT 'private'::course_visibility;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS grading_scheme grading_scheme DEFAULT 'letter'::grading_scheme;

-- Update existing courses to have default values for new columns
UPDATE courses 
SET 
    term_type = 'semester',
    visibility = 'private'::course_visibility,
    grading_scheme = 'letter'::grading_scheme
WHERE term_type IS NULL OR visibility IS NULL OR grading_scheme IS NULL;