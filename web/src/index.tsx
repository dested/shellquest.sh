import ReactDOM from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {routes} from '@/app/routes';
import {trpc, trpcClient} from '@client/trpc';
import {HelmetProvider} from 'react-helmet-async';
import {RouterProvider, createBrowserRouter} from 'react-router-dom';
import App from './App';

const router = createBrowserRouter(routes);
const queryClient = new QueryClient();

// Get the dehydrated state from the window
const dehydratedState = (window as any).__TRPC_DEHYDRATED_STATE__;

const context = {};

ReactDOM.hydrateRoot(
  document.getElementById('app') as HTMLElement,
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      {dehydratedState && (
        <QueryClientProvider client={queryClient}>{dehydratedState}</QueryClientProvider>
      )}
      <HelmetProvider context={context}>
        <App>
          <RouterProvider router={router} fallbackElement={null} />
        </App>
      </HelmetProvider>
    </QueryClientProvider>
  </trpc.Provider>,
);
