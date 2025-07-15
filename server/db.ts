import { Sequelize } from 'sequelize';

// Database configuration - support both DATABASE_URL and individual env vars
const databaseUrl = process.env.DATABASE_URL;
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432');
const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASS || 'postgres';
const dbName = process.env.DB_NAME || 'lms_platform';
const dbSchema = process.env.DB_SCHEMA || 'student_learning_hub';

let sequelize: Sequelize;

if (databaseUrl) {
  // Use DATABASE_URL if available (for production/Replit)
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: false
    }
  });
} else {
  // Use individual environment variables (for local development)
  sequelize = new Sequelize({
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPass,
    database: dbName,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: false
    },
    define: {
      schema: dbSchema,
      timestamps: true,
      underscored: false
    }
  });
}

export { sequelize };

// Test the connection
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

// Initialize database with proper schema setup
export async function initializeDatabase() {
  try {
    // Test connection first
    await testConnection();
    
    // Create schema if using local database
    if (!process.env.DATABASE_URL) {
      const schema = process.env.DB_SCHEMA || 'student_learning_hub';
      await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      console.log(`Schema "${schema}" created or already exists.`);
    }
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}