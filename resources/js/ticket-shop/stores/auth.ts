import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<{ name: string; email: string } | null>(null);
    const isAuthenticated = computed(() => !!user.value);
    
    // Check if user is already logged in via session
    async function checkAuth() {
        try {
            const response = await axios.get('/api/user');
            user.value = response.data;
        } catch (error) {
            user.value = null;
        }
    }



    async function login(username: string, password: string): Promise<string | true> {
        try {
            await axios.get('/sanctum/csrf-cookie');
            await axios.post('/api/login', {
                name: username,
                password: password
            });
            await checkAuth();
            return true;
        } catch (error: any) {
            console.error('Login failed', error);
            if (error.response) {
                if (error.response.status === 422) {
                     return 'Invalid username or password.';
                }
                if (error.response.status === 419) {
                    return 'Session expired. Please refresh the page.';
                }
                if (error.response.data && error.response.data.message) {
                    return error.response.data.message;
                }
            }
            return 'Login failed due to a network or server error.';
        }
    }

    async function logout() {
        try {
            await axios.post('/api/logout');
            user.value = null;
        } catch (error) {
            console.error('Logout failed', error);
        }
    }

    return {
        user,
        isAuthenticated,
        login,
        logout,
        checkAuth
    };
});
