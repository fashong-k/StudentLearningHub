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

- July 15, 2025: Fixed TypeScript compilation and database schema issues
  - Resolved Sequelize constructor TypeScript error in db.ts
  - Fixed database schema creation timing to ensure proper table creation
  - Ensured schema exists before Sequelize sync operations
  - All database tables and seed data now working correctly
  - System successfully creates 8 tables and 3 default users automatically

- July 15, 2025: Fixed user role TypeScript errors
  - Resolved "Property 'role' does not exist on type '{}'" errors throughout frontend
  - Added proper AuthUser interface in useAuth hook with role property typing
  - Updated all query types to properly handle course data arrays
  - Fixed TypeScript parameter typing in Messages component
  - All frontend user?.role references now properly typed and working

- July 15, 2025: Fixed database schema alignment and seeding system
  - Fixed critical Sequelize model field mapping issues (camelCase vs snake_case)
  - Updated all models to use proper field mappings (senderId -> sender_id, courseId -> course_id, etc.)
  - Fixed TypeScript errors in seedData.ts (profileImageUrl null vs undefined)
  - Environment-based seeding system now working correctly
  - Database tables properly aligned with PostgreSQL schema
  - All database operations now functioning without schema conflicts

- July 15, 2025: Successfully completed database schema resolution and full API system
  - Resolved all remaining database schema alignment issues between Sequelize models and PostgreSQL
  - Fixed timestamp column mapping (created_at/updated_at) across all tables
  - Corrected schema consistency issues (public vs student_learning_hub schemas)
  - Added missing total_points column to assignments table
  - All core APIs now fully functional: authentication, courses, assignments, announcements
  - Complete CRUD operations working for all entities
  - Database foreign key constraints properly configured
  - Live testing confirms all endpoints working correctly
  - System ready for frontend integration and deployment

- July 15, 2025: Implemented comprehensive data fallback system with intelligent error handling
  - Created useDataFallback hook for consistent error handling across all components
  - Added DataFallbackAlert component for visual feedback when database operations fail
  - Implemented RUN_MODE="demo" environment variable for controlled fallback behavior
  - Updated all major pages (Courses, Assignments, Announcements, Grades, Messages) with database-first approach
  - System gracefully falls back to sample data when database retrieval fails in demo mode
  - Added proper TypeScript typing for query data to resolve type safety issues
  - Created comprehensive .env.example file with all configuration options
  - Alert system provides clear feedback to users when using fallback data
  - Fixed all TypeScript errors with proper return type annotations (Promise<any[]>)
  - Added array type checking and missing imports across all components
  - Ensured robust error handling with complete type safety throughout the application

- July 16, 2025: Updated database configuration to eliminate hard-coded values
- July 16, 2025: Fixed missing API endpoints and resolved frontend "Failed to load data" errors
  - Added missing GET /api/grades endpoint for students and teachers with role-based access
  - Added missing GET /api/assignments endpoint for retrieving assignments across enrolled courses
  - Added missing GET /api/announcements endpoint for course announcements with proper sorting
  - Fixed TypeScript errors related to property name inconsistencies (created_at vs createdAt)
  - Resolved server port conflicts and improved application stability
  - All API endpoints now return proper JSON responses instead of HTML fallbacks
  - Student enrollment system working correctly with database persistence

- July 16, 2025: Fixed frontend fetch API parameter errors and missing conversations endpoint
  - Fixed parameter order in apiRequest function calls across all pages (method first, then URL)
  - Updated apiRequest function to return JSON data instead of Response objects
  - Fixed authentication redirects to use /login instead of /api/login throughout application
  - Added missing GET /api/conversations endpoint for Messages page functionality
  - Resolved SyntaxError "Unexpected token '<'" caused by HTML responses instead of JSON
  - All API endpoints now working correctly with proper authentication and JSON responses
  - Complete elimination of fetch API parameter errors in Grades, Messages, Courses, Assignments, and Announcements pages

- July 16, 2025: Added comprehensive user logout functionality
  - Added logout button to Navigation component with proper logout icon and hover effects
  - Added logout button to Dashboard header for easy access from main page
  - Implemented proper logout flow that calls /api/local/logout endpoint
  - Session is properly cleared on logout and user redirected to login page
  - Added error handling for logout process with fallback redirect
  - Logout buttons have visual feedback with red hover states for clear indication
  - Full logout flow tested and working: login → authenticated → logout → unauthorized

- July 16, 2025: Fixed 404 routing issue with "Sign In to Continue" button
  - Fixed Landing.tsx "Sign In to Continue" button routing from /api/login to /login
  - Updated all remaining /api/login references to /login across all frontend pages
  - Fixed authentication redirects in Assignments, Courses, Analytics, and Profile pages
  - Eliminated 404 Page Not Found errors when clicking sign-in buttons
  - All authentication routing now properly points to local login page
  - Complete resolution of broken authentication redirects throughout the application
  - Removed all hard-coded database configuration from db.ts
  - Added proper environment variable validation for DATABASE_URL and individual DB variables
  - Implemented "missing env file!" console logging for missing required variables
  - Enhanced error handling with descriptive messages for incomplete configuration
  - Ensures clean separation between development and production database setup
  - Fixed environment variable loading by implementing custom .env file reader in server/index.ts
  - Resolved process.env.DB_HOST undefined issue with manual environment variable parsing
  - Added error handling for missing .env files while maintaining compatibility
  - Moved environment variable loading to server/db.ts for better local development compatibility
  - Ensured .env file is loaded before database configuration in both Replit and local environments
  - Fixed duplicate schema creation messages by removing redundant logic in server/routes.ts
  - Schema creation now happens only once in initializeDatabase() function for cleaner console output
  - Added DB_INIT environment variable functionality for database reinitialization
  - When DB_INIT=true, all tables are dropped and recreated with fresh seed data
  - When DB_INIT=false, normal database synchronization occurs without dropping existing data
  - Enhanced environment variable loading to ensure all variables are properly loaded
  - Fixed TypeScript compilation errors related to date type conversions in API routes
  - Resolved date string to Date object conversion issues in assignment and submission creation
  - Added proper error handling for database reinitialization with fallback mechanism
  - Fixed Sequelize model warnings by converting public class fields to declare statements
  - Eliminated "Model is declaring public class fields" warnings for all Sequelize models
  - Application now runs without any console warnings or TypeScript compilation errors

## Changelog

- July 05, 2025: Initial setup and complete LMS implementation