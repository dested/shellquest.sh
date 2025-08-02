import {QueryClient} from '@tanstack/react-query';
import {httpBatchLink, httpBatchStreamLink} from '@trpc/client';
import {createTRPCProxyClient, createTRPCReact} from '@trpc/react-query';
import {inferRouterInputs, inferRouterOutputs} from '@trpc/server';
import superjson from 'superjson';
import type {AppRouter} from '../server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

export const api = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${getBaseUrl()}/api`,
    }),
  ],
});
export const apiStream = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchStreamLink({
      transformer: superjson,
      url: `${getBaseUrl()}/api`,
    }),
  ],
});

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${getBaseUrl()}/api`,
    }),
  ],
});

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
