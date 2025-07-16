CREATE TYPE "public"."assignment_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'tardy', 'excused');--> statement-breakpoint
CREATE TYPE "public"."course_visibility" AS ENUM('private', 'institution');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('assignment', 'submission', 'course_material', 'profile_image', 'announcement');--> statement-breakpoint
CREATE TYPE "public"."grading_scheme" AS ENUM('letter', 'percentage', 'points');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('assignment_due', 'grade_posted', 'announcement', 'message', 'discussion_reply');--> statement-breakpoint
CREATE TYPE "public"."plagiarism_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted', 'graded', 'returned');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'teacher', 'admin');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"author_id" varchar NOT NULL,
	"is_important" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assignment_rubrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"criteria_name" varchar(255) NOT NULL,
	"description" text,
	"max_points" numeric(10, 2) NOT NULL,
	"weight" numeric(5, 2) DEFAULT 1,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"due_date" timestamp,
	"max_points" numeric(10, 2),
	"assignment_type" varchar(50) DEFAULT 'homework',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"student_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"status" "attendance_status" NOT NULL,
	"notes" text,
	"recorded_by" varchar NOT NULL,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_type" varchar(50) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"location" varchar(255),
	"is_all_day" boolean DEFAULT false,
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_instructors" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"instructor_id" varchar NOT NULL,
	"role" varchar(50) DEFAULT 'teacher',
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"assigned_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "course_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"file_path" varchar,
	"file_size" integer,
	"mime_type" varchar(100),
	"uploaded_by" varchar NOT NULL,
	"is_visible" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_time" varchar(8) NOT NULL,
	"location" varchar(255),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"course_code" varchar(20) NOT NULL,
	"teacher_id" varchar NOT NULL,
	"semester" varchar(50),
	"year" integer,
	"term_type" varchar(20) DEFAULT 'semester',
	"start_date" timestamp,
	"end_date" timestamp,
	"visibility" "course_visibility" DEFAULT 'private',
	"grading_scheme" "grading_scheme" DEFAULT 'letter',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "courses_course_code_unique" UNIQUE("course_code")
);
--> statement-breakpoint
CREATE TABLE "discussion_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"discussion_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discussions" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"author_id" varchar NOT NULL,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar NOT NULL,
	"course_id" integer NOT NULL,
	"enrolled_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_path" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_type" "file_type" NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"related_id" integer,
	"is_public" boolean DEFAULT false,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grade_book" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"student_id" varchar NOT NULL,
	"assignment_id" integer,
	"points" numeric(10, 2),
	"max_points" numeric(10, 2),
	"letter_grade" varchar(2),
	"percentage" numeric(5, 2),
	"feedback" text,
	"graded_by" varchar,
	"graded_at" timestamp,
	"is_excused" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"course_id" integer,
	"subject" varchar(255),
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_id" varchar NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"related_id" integer,
	"is_read" boolean DEFAULT false,
	"sent_at" timestamp DEFAULT now(),
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "plagiarism_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"original_text" text NOT NULL,
	"similarity_score" numeric(5, 2),
	"matched_sources" jsonb,
	"suspicious_patterns" jsonb,
	"analysis_results" jsonb,
	"status" "plagiarism_status" DEFAULT 'pending',
	"checked_at" timestamp DEFAULT now(),
	"checked_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plagiarism_database" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"student_id" varchar NOT NULL,
	"assignment_id" integer NOT NULL,
	"text_content" text NOT NULL,
	"text_fingerprint" varchar(64),
	"word_count" integer,
	"submitted_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"student_id" varchar NOT NULL,
	"attempt_number" integer NOT NULL,
	"answers" jsonb,
	"score" numeric(10, 2),
	"max_score" numeric(10, 2),
	"started_at" timestamp DEFAULT now(),
	"submitted_at" timestamp,
	"time_spent" integer,
	"is_completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"question_type" varchar(50) NOT NULL,
	"question_text" text NOT NULL,
	"options" jsonb,
	"correct_answer" text,
	"points" numeric(10, 2) DEFAULT 1,
	"explanation" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"instructions" text,
	"time_limit" integer,
	"attempts" integer DEFAULT 1,
	"show_results" boolean DEFAULT false,
	"shuffle_questions" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"available_from" timestamp,
	"available_to" timestamp,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"student_id" varchar NOT NULL,
	"submission_text" text,
	"file_path" varchar,
	"submitted_at" timestamp DEFAULT now(),
	"grade" numeric(10, 2),
	"feedback" text,
	"graded_at" timestamp,
	"is_late" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" varchar,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"theme" varchar(20) DEFAULT 'light',
	"language" varchar(10) DEFAULT 'en',
	"timezone" varchar(50) DEFAULT 'UTC',
	"email_notifications" boolean DEFAULT true,
	"push_notifications" boolean DEFAULT true,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");