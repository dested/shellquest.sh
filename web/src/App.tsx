import {useState} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import HelmetProvider from '@client/contexts/HelmetContext';
import {trpc, trpcClient} from '@client/trpc';
import {Helmet} from 'react-helmet-async';

function App(props: any) {
  const [queryClient] = useState(() => new QueryClient({defaultOptions: {}}));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Helmet>
          <title>shellquest.sh</title>
        </Helmet>

        <HelmetProvider>{props.children}</HelmetProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
