import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User, LoginCredentials, RegisterData } from '../services/authService';
import { notifications } from '@mantine/notifications';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for stored user first
        const storedUser = authService.getStoredUser();
        if (storedUser) {
          // Verify with server
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.warn('Auth initialization failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const user = await authService.login(credentials);
      setUser(user);

      notifications.show({
        title: 'Bienvenido',
        message: `Hola ${user.nombre}!`,
        color: 'green',
      });
    } catch (error: unknown) {
      notifications.show({
        title: 'Error de autenticación',
        message: error.message || 'Credenciales inválidas',
        color: 'red',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.register(data);

      notifications.show({
        title: 'Registro exitoso',
        message: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
        color: 'green',
      });
    } catch (error: unknown) {
      notifications.show({
        title: 'Error de registro',
        message: error.message || 'Error al crear la cuenta',
        color: 'red',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);

      notifications.show({
        title: 'Sesión cerrada',
        message: 'Has cerrado sesión exitosamente',
        color: 'blue',
      });
    } catch (error) {
      console.warn('Logout error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
