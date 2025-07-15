# Local PostgreSQL Setup Guide

## Prerequisites

1. PostgreSQL installed and running on your local machine
2. Node.js 18+ installed
3. Your database settings as provided:
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: postgres
   - Database: lms_platform
   - Schema: student_learning_hub

## Setup Steps

### 1. Database Setup

Create the database and schema in your PostgreSQL:

```sql
-- Connect to PostgreSQL as postgres user
CREATE DATABASE lms_platform;
\c lms_platform;

-- Create the schema
CREATE SCHEMA IF NOT EXISTS student_learning_hub;

-- Set the search path to use the schema
SET search_path TO student_learning_hub;
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=lms_platform
DB_SCHEMA=student_learning_hub
NODE_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Application

```bash
npm run dev
```

**Note for Windows Users:**
If you get the error `'NODE_ENV' is not recognized as an internal or external command`, the `cross-env` package has been added to make the scripts work on Windows. The npm scripts will automatically use cross-platform environment variable setting.

## Database Schema

The application will automatically create the following tables in your `student_learning_hub` schema:

- `users` - User accounts with roles (student, teacher, admin)
- `courses` - Course information
- `enrollments` - Student-course relationships
- `assignments` - Course assignments
- `submissions` - Student assignment submissions
- `announcements` - Course announcements
- `messages` - User messaging
- `sessions` - Session storage for authentication

## Authentication Notes

For local development, the application automatically switches to local authentication when no DATABASE_URL is provided. 

### Local Login Credentials

The application includes a local login system with these pre-configured accounts:

**Administrator Account:**
- Username: `admin`
- Password: `admin123`
- Role: Admin (full system access)

**Teacher Account:**
- Username: `teacher`
- Password: `teacher123`
- Role: Teacher (can create courses, assignments, grade students)

**Student Account:**
- Username: `student`
- Password: `student123`
- Role: Student (can enroll in courses, submit assignments)

### Login Process

1. Start the application with `npm run dev`
2. Visit `http://localhost:5000` in your browser
3. You'll see the local login page with credentials displayed
4. Use any of the above credentials to log in
5. The application will automatically create user accounts in your database

## Features Available

- ✅ Complete course management system
- ✅ Assignment creation and submission
- ✅ User roles (student, teacher, admin)
- ✅ Real-time messaging
- ✅ Announcement system
- ✅ Grade tracking and analytics
- ✅ File upload support
- ✅ Responsive modern UI

## Troubleshooting

1. **Database Connection Issues**: 
   - Ensure PostgreSQL is running
   - Check that the database `lms_platform` exists
   - Verify the schema `student_learning_hub` is created

2. **Authentication Issues**:
   - Authentication requires Replit environment
   - For local testing, you may need to bypass auth temporarily

3. **Permission Issues**:
   - Ensure your PostgreSQL user has proper permissions
   - Grant necessary permissions to the schema

## Development Notes

- The application uses Sequelize ORM for database operations
- All database operations are properly typed with TypeScript
- The UI is built with React, Tailwind CSS, and shadcn/ui components
- Real-time features use WebSocket connections