import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { BrowserRouter } from 'react-router-dom';
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

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;