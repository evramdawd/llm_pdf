import type {Config} from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({path:'.env'}); // loads the .env file, making it accessible in process.env

export default {
  driver: 'pg',
  schema: './src/lib/db/schema.ts',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  }
} satisfies Config

// Press control+space for type annotations for what configurations are available

// npx drizzle-kit push:pg  -> whenever we push our  -- takes a look at our scheme and checks our Neon DB against it 