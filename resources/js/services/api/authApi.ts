import api from './axiosInstance';

export interface AuthUser {
  name: string;
  email: string;
}

export const authApi = {
  getUser: () =>
    api.get<AuthUser>('/api/user').then(r => r.data),

  login: (name: string, password: string) =>
    api.post('/api/login', { name, password }),

  logout: () =>
    api.post('/api/logout'),
};
