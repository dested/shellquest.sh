import {PrismaClient} from '@server/generated/prisma';
import {initTRPC, TRPCError} from '@trpc/server';
import superjson from 'superjson';
import type {User, Session} from '../src/auth';
import {auth} from './auth';

let prismaInstance: PrismaClient | null = null;

// Create singleton Prisma instance with credentials
export function getPrismaClient() {
  if (prismaInstance) return prismaInstance;
  prismaInstance = new PrismaClient();
  return prismaInstance;
}

// Create context type
export type TrpcContext = {
  user: User | null;
  session: Session | null;
  serverId: string;
  prisma: PrismaClient;
  req: any;
  res: any;
};

const serverId = Math.random().toString(36).substring(7);

// Create context for each request
export const createContext = async ({req, res}: {req: any; res: any}): Promise<TrpcContext> => {
  const prisma = getPrismaClient();

  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: req.headers as any,
  });

  return {
    serverId: serverId,
    user: session?.user || null,
    session: session?.session || null,
    prisma,
    req,
    res,
  };
};

// Initialize tRPC
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});
export const createCallerFactory = t.createCallerFactory;

const isUser = t.middleware(({ctx, next}) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You are not authorized to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Export procedures builders
export const router = t.router;
export const publicProcedure = t.procedure;
export const userProcedure = t.procedure.use(isUser);
