import * as dotenv from 'dotenv';
import {z} from 'zod';

dotenv.config();

// Define the environment schema
const envSchema = z.object({
    // Database
    DATABASE_URL: z.string()/*.url().describe('PostgreSQL connection string')*/,

    // Authentication
    BETTER_AUTH_SECRET: z.string().min(32).describe('Better Auth secret key'),

    // Server
    PORT: z.string().regex(/^\d+$/).default('3000').transform(Number).describe('Server port'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Build
    BUILD_TARGET: z.enum(['server', 'client']).optional(),
    VITEST: z.string().optional(),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsedEnv.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
}

// Export typed environment variables
export const env = parsedEnv.data;

// Type for environment variables
export type Env = z.infer<typeof envSchema>;