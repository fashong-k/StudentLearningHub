import { Sequelize } from 'sequelize';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env file if not already loaded
if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
  try {
    const envPath = join(process.cwd(), '.env');
    const envFile = readFileSync(envPath, 'utf8');
    
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key.trim()] = value;
        }
      }
    });
    
    console.log('Environment variables loaded from .env file');
  } catch (error) {
    console.log('No .env file found or error reading it:', error);
  }
}

// Database configuration - support both DATABASE_URL and individual env vars
const databaseUrl = process.env.DATABASE_URL;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbName = process.env.DB_NAME;
const dbSchema = process.env.DB_SCHEMA;

let sequelize: Sequelize;

// Check if we have DATABASE_URL or individual database variables
if (databaseUrl && databaseUrl.trim() !== '') {
  // Use DATABASE_URL if available (for production/Replit)
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: false
    }
  });
} else if (dbHost && dbPort && dbUser && dbPass && dbName) {
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
      schema: dbSchema || 'student_learning_hub',
      timestamps: true,
      underscored: false
    }
  });
} else {
  console.log("missing env file!");
  throw new Error("Database configuration missing: Either DATABASE_URL or DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME must be provided in .env file");
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
    if (!databaseUrl) {
      if (!dbSchema) {
        console.log("missing env file!");
        throw new Error("DB_SCHEMA environment variable is required for local database setup");
      }
      await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${dbSchema}"`);
      console.log(`Schema "${dbSchema}" is ready for table creation.`);
    }
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}