import { authService } from '../authService';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('token management', () => {
    it('should get token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');
      
      const token = authService.getToken();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(token).toBe('mock-token');
    });

    it('should set token in localStorage', () => {
      authService.setToken('new-token');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    it('should remove token from localStorage', () => {
      authService.removeToken();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should return null when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const token = authService.getToken();
      
      expect(token).toBeNull();
    });
  });

  describe('token validation', () => {
    it('should return true for valid token', () => {
      // Mock de un token JWT válido (no expirado)
      const validToken = 'mock.valid.token';
      
      mockLocalStorage.getItem.mockReturnValue(validToken);
      
      const isValid = authService.isTokenValid();
      
      expect(isValid).toBe(true);
    });

    it('should return false for expired token', () => {
      // Mock de un token JWT expirado
      const expiredToken = 'mock.expired.token';
      
      mockLocalStorage.getItem.mockReturnValue(expiredToken);
      
      const isValid = authService.isTokenValid();
      
      expect(isValid).toBe(false);
    });

    it('should return false for invalid token format', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');
      
      const isValid = authService.isTokenValid();
      
      expect(isValid).toBe(false);
    });

    it('should return false when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const isValid = authService.isTokenValid();
      
      expect(isValid).toBe(false);
    });
  });

  describe('user data', () => {
    it('should get user data from valid token', () => {
      const tokenWithUser = 'mock.user.token';
      
      mockLocalStorage.getItem.mockReturnValue(tokenWithUser);
      
      const userData = authService.getUserData();
      
      expect(userData).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        email: 'john@example.com',
        iat: 1516239022,
        exp: 9999999999
      });
    });

    it('should return null for invalid token', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');
      
      const userData = authService.getUserData();
      
      expect(userData).toBeNull();
    });

    it('should return null when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const userData = authService.getUserData();
      
      expect(userData).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear all auth data on logout', () => {
      authService.logout();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });
});