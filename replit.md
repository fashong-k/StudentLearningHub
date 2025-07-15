# EduPortal - Student-Teacher Learning Management System

## Overview

EduPortal is a comprehensive Learning Management System (LMS) built with modern web technologies. It provides a complete educational platform that facilitates interaction between students and teachers, course management, assignment handling, and academic progress tracking. The system is designed to be intuitive, secure, and scalable.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Radix UI components with custom styling
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Component Library**: Comprehensive UI components using shadcn/ui architecture

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Sequelize ORM
- **Database Provider**: Supports both Neon Database (@neondatabase/serverless) and local PostgreSQL
- **Session Management**: Express sessions with PostgreSQL store
- **File Uploads**: Multer for handling file uploads
- **Authentication**: Replit Auth integration with OpenID Connect

## Key Components

### Database Schema
The system uses a comprehensive PostgreSQL schema with the following core entities:
- **Users**: Stores user profiles with role-based access (student, teacher, admin)
- **Courses**: Course information with teacher assignments
- **Enrollments**: Student-course relationships
- **Assignments**: Course assignments with due dates and requirements
- **Submissions**: Student assignment submissions with grading
- **Announcements**: Course-wide announcements
- **Messages**: Direct messaging between users
- **Discussions**: Course discussion boards with replies
- **Sessions**: Session storage for authentication

### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions
- **Role-based Access**: Student, Teacher, and Admin roles
- **Security**: HTTP-only cookies with secure flags

### Core Features
1. **User Management**: Profile management with role-based permissions
2. **Course Management**: Create, organize, and manage courses
3. **Assignment System**: Assignment creation, submission, and grading
4. **Communication**: Announcements, messaging, and discussion boards
5. **Dashboard**: Personalized dashboards for different user roles
6. **File Management**: Upload and download course materials
7. **Calendar Integration**: Track deadlines and events

## Data Flow

### Authentication Flow
1. User initiates login via Replit Auth
2. OpenID Connect validates credentials
3. User session created in PostgreSQL
4. Role-based access granted based on user profile

### Course Management Flow
1. Teachers create courses with metadata
2. Students enroll in available courses
3. Course materials and assignments are managed
4. Progress tracking and grading workflows

### Assignment Workflow
1. Teachers create assignments with requirements
2. Students submit assignments through file uploads
3. Grading and feedback system
4. Grade book management

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service
- **File Storage**: Local file system with multer
- **UI Components**: Radix UI primitives
- **Validation**: Zod for schema validation
- **Date Handling**: date-fns for date operations

### Development Dependencies
- **TypeScript**: Type safety and development experience
- **ESBuild**: Fast bundling for production
- **Vite**: Development server and build tool
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev`
- **Features**: Hot reload, development logging, Vite middleware
- **Database**: Development database with migrations

### Production Build
- **Frontend**: Vite build process creating optimized static assets
- **Backend**: ESBuild bundling for Node.js deployment
- **Database**: Drizzle migrations for schema management
- **Command**: `npm run build && npm start`

### Database Management
- **Migrations**: Drizzle Kit for schema migrations
- **Connection**: Pooled connections via Neon serverless
- **Schema**: Centralized schema definitions in shared directory

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- January 15, 2025: Successfully migrated from Drizzle ORM to Sequelize ORM
  - Converted all database operations to use Sequelize models
  - Created comprehensive TypeScript interfaces for all entities
  - Updated storage layer to use Sequelize with proper relationships
  - Added support for both Neon Database (production) and local PostgreSQL
  - Implemented flexible database configuration for local development
  - Added proper error handling for database connection issues
  - Created LOCAL_SETUP.md guide for local PostgreSQL setup
  - Configured database schema support for custom schemas (student_learning_hub)

- January 15, 2025: Resolved Windows compatibility issues
  - Completely removed NODE_ENV from server code to fix Windows compatibility
  - Updated database configuration to work without NODE_ENV dependencies
  - Modified server/index.ts to detect development/production mode by checking build directory
  - Created simplified Windows batch file (start-dev.bat) for easy local startup
  - Updated .env file to contain only database connection parameters
  - Application now works seamlessly on Windows without cross-env dependencies

- July 05, 2025: Completed comprehensive LMS development
  - Built complete authentication system with Replit Auth
  - Created full database schema with PostgreSQL for courses, assignments, submissions
  - Developed responsive UI with modern design using Tailwind CSS and shadcn/ui
  - Implemented role-based dashboard for students and teachers
  - Added navigation system with all core LMS features
  - Fixed authentication flow and import issues
  - Successfully tested login/logout functionality
  - User feedback: "looks good" - application approved and working

- July 15, 2025: Implemented comprehensive seed data system
  - Added automatic default user creation on application startup
  - Created seed-data.js script for manual user creation
  - Integrated seed data into main application startup flow
  - Default users: admin/admin123, teacher/teacher123, student/student123
  - Enhanced database setup with user verification and creation
  - Updated documentation with seed data information

## Changelog

- July 05, 2025: Initial setup and complete LMS implementation