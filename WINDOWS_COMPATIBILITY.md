# Windows Compatibility Guide

## NODE_ENV Status Summary

### ✅ Completely Removed from Server Code
- `server/index.ts` - Uses build directory detection instead of NODE_ENV
- `server/db.ts` - Removed all NODE_ENV references from database config
- `server/routes.ts` - No NODE_ENV dependencies
- `server/storage.ts` - No NODE_ENV dependencies
- `.env` file - Clean, only contains database parameters

### ❌ Still Present in Configuration Files (Cannot be Modified)
- `package.json` - npm scripts still use NODE_ENV (system restriction)
- `vite.config.ts` - Contains NODE_ENV check for Replit features (system restriction)

## Windows-Compatible Startup Methods

### Method 1: Direct Command (Recommended for Windows)
```bash
tsx server/index.ts
```
- Bypasses npm scripts completely
- No NODE_ENV errors
- Works on all Windows systems

### Method 2: Windows Batch File (Easiest)
```batch
start-dev.bat
```
- Double-click to run
- Shows helpful information
- Bypasses npm scripts

### Method 3: npm Script (May cause NODE_ENV errors on Windows)
```bash
npm run dev
```
- Works on most systems
- May show NODE_ENV errors on Windows Command Prompt
- Still functional despite errors

## How It Works

The application now automatically detects development vs production mode:

1. **Development Mode**: When no build directory exists (`dist/client`)
   - Uses Vite for hot reloading
   - Serves frontend with development features

2. **Production Mode**: When build directory exists
   - Serves static files from build directory
   - Optimized for production deployment

## Database Configuration

Your `.env` file contains only these parameters:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=lms_platform
DB_SCHEMA=student_learning_hub
```

## Authentication

Local authentication works without PostgreSQL:
- Admin: admin / admin123
- Teacher: teacher / teacher123
- Student: student / student123

## Troubleshooting

### "NODE_ENV is not recognized" Error
- Use Method 1 or 2 above
- Don't use `npm run dev` on Windows Command Prompt

### Database Connection Errors
- Normal behavior if PostgreSQL isn't running
- Application continues to work with local authentication
- Set up PostgreSQL later if needed

### Port 5000 Already in Use
- Kill existing processes on port 5000
- Or modify port in `server/index.ts` if needed