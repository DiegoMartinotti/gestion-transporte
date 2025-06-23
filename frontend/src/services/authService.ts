import { apiService } from './api';
import { ApiResponse } from '../types';

export interface User {
  id: string;
  email: string;
  nombre: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    const response: ApiResponse<User> = await apiService.post('/auth/login', credentials);
    
    // Backend returns { success: true, user: {...} } directly, not wrapped in data
    if (response.success && (response as any).user) {
      const user = (response as any).user;
      localStorage.setItem('auth_user', JSON.stringify(user));
      return user;
    }
    
    throw new Error(response.message || response.error || 'Login failed');
  }

  async register(data: RegisterData): Promise<void> {
    const response: ApiResponse<void> = await apiService.post('/auth/register', data);
    
    if (!response.success) {
      throw new Error(response.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      localStorage.removeItem('auth_user');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response: ApiResponse<User> = await apiService.get('/auth/me');
      
      // Backend returns { success: true, user: {...} } directly
      if (response.success && (response as any).user) {
        const user = (response as any).user;
        localStorage.setItem('auth_user', JSON.stringify(user));
        return user;
      }
    } catch (error) {
      localStorage.removeItem('auth_user');
      throw error;
    }
    
    return null;
  }

  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('auth_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      localStorage.removeItem('auth_user');
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.getStoredUser() !== null;
  }
}

export const authService = new AuthService();
export default authService;