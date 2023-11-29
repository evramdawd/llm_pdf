import {neon, neonConfig} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';

// Caches the connections that are being set:
neonConfig.fetchConnectionCache = true;

// If DB URL doesn't exist in env - throw error
if(!process.env.DATABASE_URL) {
  throw new Error('Database url not found');
}

const sql = neon(process.env.DATABASE_URL);

// db will be our way of interacting with neon/drizzle
export const db = drizzle(sql);