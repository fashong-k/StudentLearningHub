@echo off
echo ================================
echo   LMS Development Server
echo ================================
echo.
echo This batch file bypasses npm scripts to avoid NODE_ENV issues on Windows.
echo.
echo Database Settings (optional):
echo - Host: localhost:5432
echo - Database: lms_platform
echo - Schema: student_learning_hub
echo - User: postgres / postgres
echo.
echo Login Credentials:
echo - Admin: admin / admin123
echo - Teacher: teacher / teacher123
echo - Student: student / student123
echo.
echo Note: The app will work even without PostgreSQL running.
echo.
echo Starting server on http://localhost:5000...
echo Press Ctrl+C to stop the server.
echo.
tsx server/index.ts