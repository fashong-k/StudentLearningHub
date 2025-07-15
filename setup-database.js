#!/usr/bin/env node

// Database setup script for local development
import { sequelize, initializeDatabase } from './server/db.js';
import { setupAssociations } from './server/models/models.js';

console.log('=================================');
console.log('  Database Setup Script');
console.log('=================================');
console.log('');

async function setupDatabase() {
  try {
    console.log('1. Initializing database connection...');
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('❌ Database initialization failed!');
      console.log('');
      console.log('Make sure PostgreSQL is running with these settings:');
      console.log('- Host: localhost:5432');
      console.log('- Database: lms_platform');
      console.log('- User: postgres');
      console.log('- Password: postgres');
      console.log('- Schema: student_learning_hub');
      process.exit(1);
    }
    
    console.log('✅ Database connection established');
    console.log('');
    
    console.log('2. Setting up model associations...');
    setupAssociations();
    console.log('✅ Model associations configured');
    console.log('');
    
    console.log('3. Creating database tables...');
    await sequelize.sync({ force: false });
    console.log('✅ Database tables synchronized');
    console.log('');
    
    console.log('4. Verifying tables exist...');
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      ORDER BY table_name;
    `, {
      bind: [process.env.DB_SCHEMA || 'student_learning_hub'],
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📋 Tables found in database:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found. This might indicate a schema issue.');
    } else {
      console.log('');
      console.log('✅ Database setup completed successfully!');
      console.log('');
      console.log('You can now start the application with:');
      console.log('  npm run dev');
      console.log('  or');
      console.log('  tsx server/index.ts');
      console.log('  or');
      console.log('  start-dev.bat');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('');
    console.log('Common solutions:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your .env file has correct database settings');
    console.log('3. Verify the database "lms_platform" exists');
    console.log('4. Ensure the user "postgres" has proper permissions');
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

setupDatabase();