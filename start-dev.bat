@echo off
echo Starting LMS Development Server...
echo.
echo Make sure your PostgreSQL database is running with these settings:
echo - Host: localhost
echo - Port: 5432
echo - Database: lms_platform
echo - Schema: student_learning_hub
echo - User: postgres
echo - Password: postgres
echo.
echo Login credentials:
echo - Admin: admin / admin123
echo - Teacher: teacher / teacher123
echo - Student: student / student123
echo.
echo Starting server...
npm run dev