import {PrismaClient} from '@server/generated/prisma';
import {getPrismaClient} from '@server/trpc';
import {betterAuth} from 'better-auth';
import {prismaAdapter} from 'better-auth/adapters/prisma';
import {createAuthMiddleware, APIError} from 'better-auth/api';
import {env} from './env';

export const auth = betterAuth({
  database: prismaAdapter(new PrismaClient(), {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {


    }),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  trustedOrigins: ['http://localhost:9421'],
  secret: env.BETTER_AUTH_SECRET,
});
