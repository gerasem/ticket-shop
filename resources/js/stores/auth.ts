import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../services/api/authApi';
import type { AuthUser } from '../services/api/authApi';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const isAuthenticated = computed(() => !!user.value);

  const checkAuth = async () => {
    try {
      user.value = await authApi.getUser();
    } catch {
      user.value = null;
    }
  };

  const login = async (username: string, password: string): Promise<string | true> => {
    try {
      await authApi.login(username, password);
      await checkAuth();
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 422) return 'Invalid username or password.';
      if (err.response?.status === 419) return 'Session expired. Please refresh the page.';
      if (err.response?.data?.message) return err.response.data.message;
      return 'Login failed due to a network or server error.';
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      user.value = null;
    }
  };

  return { user, isAuthenticated, login, logout, checkAuth };
});
