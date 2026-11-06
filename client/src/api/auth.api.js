import apiClient from './client.js'

export const authApi = {
  demoLogin: (email) => apiClient('/auth/demo-login', { method: 'POST', body: { email } }),
  login: (email, password) => apiClient('/auth/login', { method: 'POST', body: { email, password } }),
  register: (userData) => apiClient('/auth/register', { method: 'POST', body: userData }),
  getDemoUsers: () => apiClient('/auth/demo-users'),
  getMe: () => apiClient('/auth/me')
}

export default authApi

