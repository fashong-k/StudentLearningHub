#!/usr/bin/env node

// Database verification script
import { sequelize } from './server/db.js';

console.log('=================================');
console.log('  Database Verification Script');
console.log('=================================');
console.log('');

async function verifyDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    console.log('');
    
    const schema = process.env.DB_SCHEMA || 'student_learning_hub';
    console.log(`Checking schema: ${schema}`);
    
    // Check if schema exists
    const schemas = await sequelize.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1;
    `, {
      bind: [schema],
      type: sequelize.QueryTypes.SELECT
    });
    
    if (schemas.length === 0) {
      console.log('❌ Schema does not exist');
      return;
    }
    
    console.log('✅ Schema exists');
    console.log('');
    
    // Check tables in schema
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      ORDER BY table_name;
    `, {
      bind: [schema],
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📋 Tables in schema:');
    if (tables.length === 0) {
      console.log('   (No tables found)');
    } else {
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    }
    
    // Expected tables
    const expectedTables = [
      'users', 'courses', 'enrollments', 'assignments', 
      'submissions', 'announcements', 'messages', 'sessions'
    ];
    
    console.log('');
    console.log('Expected tables:');
    expectedTables.forEach((table, index) => {
      const exists = tables.some(t => t.table_name === table);
      console.log(`   ${index + 1}. ${table} ${exists ? '✅' : '❌'}`);
    });
    
    // Check if all tables exist
    const allTablesExist = expectedTables.every(table => 
      tables.some(t => t.table_name === table)
    );
    
    console.log('');
    if (allTablesExist) {
      console.log('✅ All expected tables exist!');
      console.log('Your database is properly set up.');
    } else {
      console.log('⚠️  Some tables are missing.');
      console.log('Run the application to create missing tables:');
      console.log('  npm run dev');
      console.log('  or');
      console.log('  tsx server/index.ts');
    }
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.log('');
    console.log('Make sure:');
    console.log('1. PostgreSQL is running on localhost:5432');
    console.log('2. Database "lms_platform" exists');
    console.log('3. User "postgres" has correct password');
    console.log('4. Check your .env file settings');
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

verifyDatabase();