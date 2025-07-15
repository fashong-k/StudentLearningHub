#!/usr/bin/env node

// Seed data script for creating default users
import { sequelize, initializeDatabase } from './server/db.js';
import { User, setupAssociations } from './server/models/models.js';

console.log('=================================');
console.log('  Database Seed Data Script');
console.log('=================================');
console.log('');

async function seedDatabase() {
  try {
    console.log('1. Initializing database connection...');
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('❌ Database initialization failed!');
      process.exit(1);
    }
    
    console.log('✅ Database connection established');
    console.log('');
    
    console.log('2. Setting up model associations...');
    setupAssociations();
    console.log('✅ Model associations configured');
    console.log('');
    
    console.log('3. Synchronizing database...');
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized');
    console.log('');
    
    console.log('4. Creating default users...');
    
    // Default users data
    const defaultUsers = [
      {
        id: 'admin',
        email: 'admin@lms.local',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        profileImageUrl: null
      },
      {
        id: 'teacher',
        email: 'teacher@lms.local',
        firstName: 'John',
        lastName: 'Teacher',
        role: 'teacher',
        profileImageUrl: null
      },
      {
        id: 'student',
        email: 'student@lms.local',
        firstName: 'Jane',
        lastName: 'Student',
        role: 'student',
        profileImageUrl: null
      }
    ];
    
    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findByPk(userData.id);
        
        if (existingUser) {
          console.log(`   ⚠️  User "${userData.id}" already exists, skipping...`);
        } else {
          // Create the user
          await User.create(userData);
          console.log(`   ✅ Created user: ${userData.id} (${userData.role})`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create user "${userData.id}":`, error.message);
      }
    }
    
    console.log('');
    console.log('5. Verifying created users...');
    
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'role'],
      order: [['role', 'ASC']]
    });
    
    console.log('📋 Users in database:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.id} - ${user.firstName} ${user.lastName} (${user.role})`);
    });
    
    console.log('');
    console.log('✅ Seed data creation completed!');
    console.log('');
    console.log('🔐 Default login credentials:');
    console.log('   Admin:   admin / admin123');
    console.log('   Teacher: teacher / teacher123');
    console.log('   Student: student / student123');
    console.log('');
    console.log('Note: These are the usernames for login. Passwords are handled by the authentication system.');
    
  } catch (error) {
    console.error('❌ Seed data creation failed:', error.message);
    console.log('');
    console.log('Make sure:');
    console.log('1. Database tables exist (run: node setup-database.js)');
    console.log('2. PostgreSQL is running');
    console.log('3. Database connection is working');
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seedDatabase();