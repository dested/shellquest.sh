import {createCallerFactory, router, TrpcContext} from '../trpc';

export const appRouter = router({
});
export const createCaller = createCallerFactory(appRouter);

export async function getCaller(context: Partial<TrpcContext>) {
  return createCaller(context as TrpcContext);
}

export type AppRouter = typeof appRouter;
