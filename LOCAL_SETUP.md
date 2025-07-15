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
```

**Note:** NODE_ENV has been completely removed from the application for Windows compatibility.

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup and Verification

**Check if your database is properly configured:**

```bash
node verify-database.js
```

This will show you which tables exist and which are missing.

**Set up database tables (optional):**

```bash
node setup-database.js
```

This script will:
- Test the database connection
- Create the schema if it doesn't exist
- Create all necessary tables
- Show you which tables were created

**Important:** The application will automatically create tables when you start it for the first time. The setup script is just for verification and troubleshooting.

### 5. Start the Application

**Option 1: Using npm script (works on all platforms)**
```bash
npm run dev
```

**Option 2: Direct command (Windows-friendly, bypasses npm script)**
```bash
tsx server/index.ts
```

**Option 3: Windows batch file (easiest for Windows users)**
```batch
start-dev.bat
```

**Important Notes:**
- NODE_ENV has been completely removed from the server code for Windows compatibility
- The application automatically detects development vs production mode by checking if a build directory exists
- All three startup methods work without NODE_ENV-related errors
- The application will continue to work even if PostgreSQL is not running (uses local authentication)

**About NODE_ENV in Configuration Files:**
- `package.json`: Contains NODE_ENV in npm scripts but cannot be modified for system stability
- `vite.config.ts`: Contains NODE_ENV check for Replit-specific features but cannot be modified
- **Solution**: Use Option 2 or 3 above to bypass npm scripts entirely
- The server application itself has been made completely NODE_ENV-free for Windows compatibility

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

**What happens when you start the application:**

1. The application connects to your PostgreSQL database
2. It creates the `student_learning_hub` schema if it doesn't exist
3. It creates all necessary tables using Sequelize ORM
4. You'll see messages like:
   - "Database connection has been established successfully."
   - "Schema 'student_learning_hub' created or already exists."
   - "Database synchronized successfully."
   - "All database tables have been created successfully."

**If you see these messages, your database is working correctly!**

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

1. Start the application using one of the methods above
2. Visit `http://localhost:5000` in your browser
3. You'll see the local login page with credentials displayed
4. Use any of the above credentials to log in
5. The application will automatically create user accounts in your database

## Windows Troubleshooting

### NODE_ENV Error on Windows

**Problem:** Getting `'NODE_ENV' is not recognized as an internal or external command` error

**Solution:** The server application code has been made completely NODE_ENV-free. However, some configuration files still contain NODE_ENV references that cannot be modified:

1. **Quick Fix:** Use the direct command instead of npm:
   ```bash
   tsx server/index.ts
   ```

2. **Easiest Fix:** Use the Windows batch file:
   ```batch
   start-dev.bat
   ```

3. **Technical Details:**
   - The server application (`server/index.ts`, `server/db.ts`, etc.) has been completely cleaned of NODE_ENV
   - `package.json` scripts still use NODE_ENV but can be bypassed
   - `vite.config.ts` uses NODE_ENV for Replit-specific features but doesn't affect local development

### Database Connection Issues

**Problem:** Database connection errors on startup

**Solution:** The application is designed to work without PostgreSQL:
- It will show database connection errors but continue running
- Local authentication will work even without database
- You can set up PostgreSQL later if needed

### Port Already in Use

**Problem:** Port 5000 is already in use

**Solution:** 
1. Kill any existing processes using port 5000
2. Or modify the port in `server/index.ts` if needed

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