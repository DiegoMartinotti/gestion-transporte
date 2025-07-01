import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import { ErrorBoundary } from './components/base';
import { AuthProvider } from './contexts/AuthContext';
import { EntityNamesProvider } from './contexts/EntityNamesContext';
import AppRoutes from './Router';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/spotlight/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <Notifications />
          <ModalsProvider>
            <BrowserRouter>
              <AuthProvider>
                <EntityNamesProvider>
                  <AppRoutes />
                </EntityNamesProvider>
              </AuthProvider>
            </BrowserRouter>
          </ModalsProvider>
        </MantineProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;