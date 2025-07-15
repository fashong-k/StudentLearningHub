import { Sequelize } from 'sequelize';

// Database configuration - support both DATABASE_URL and individual env vars
const databaseUrl = process.env.DATABASE_URL;
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432');
const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASS || 'postgres';
const dbName = process.env.DB_NAME || 'lms_platform';
const dbSchema = process.env.DB_SCHEMA || 'public';

let sequelizeConfig;

if (databaseUrl) {
  // Use DATABASE_URL if available (for production/Replit)
  sequelizeConfig = {
    connectionString: databaseUrl,
    dialect: 'postgres' as const,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  };
} else {
  // Use individual environment variables (for local development)
  sequelizeConfig = {
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPass,
    database: dbName,
    dialect: 'postgres' as const,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: false
    },
    define: {
      schema: dbSchema
    }
  };
}

export const sequelize = new Sequelize(sequelizeConfig);

// Test the connection
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}