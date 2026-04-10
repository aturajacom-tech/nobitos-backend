/**
 * Database Configuration
 * Supabase PostgreSQL connection pool
 */

import postgres from 'postgres';

let pool: postgres.Sql | null = null;

export async function initializeDatabase(): Promise<postgres.Sql> {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL ||
    `postgresql://postgres:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`;

  try {
    pool = postgres(connectionString, {
      ssl: 'require'
    });

    // Test connection
    await pool`SELECT 1 as test`;
    console.log('✅ Database connection verified');

    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export function getDatabase(): postgres.Sql {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
    } catch (error) {
      console.error('Error closing database:', error);
    }
    pool = null;
    console.log('✅ Database connection closed');
  }
}

// Utility functions for queries
// Note: This is a placeholder for raw SQL execution
// The postgres library uses tagged template literals for queries
// These functions are here for compatibility with existing code patterns

export async function query(text: string, params?: any[]): Promise<any[]> {
  const db = getDatabase();
  try {
    // For now, we'll throw an error instructing to use postgres template literals
    throw new Error('Use postgres library template literals: db`SELECT * FROM table WHERE id = ${id}`');
  } catch (error: unknown) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function queryOne(text: string, params?: any[]): Promise<any> {
  // Placeholder
  return null;
}

export async function queryMany(text: string, params?: any[]): Promise<any[]> {
  // Placeholder
  return [];
}
