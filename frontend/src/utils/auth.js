export const getAuthToken = () => localStorage.getItem('token');

export const setAuthToken = (token) => localStorage.setItem('token', token);

export const removeAuthToken = () => localStorage.removeItem('token');

export const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json'
});
