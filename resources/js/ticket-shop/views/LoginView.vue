<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;
  
  const result = await authStore.login(username.value, password.value);
  
  if (result === true) {
    // Redirect to home or admin dashboard
    router.push('/');
  } else {
    error.value = result as string;
  }
  
  isLoading.value = false;
};
</script>

<template>
  <div class="columns is-centered is-vcentered" style="min-height: 80vh;">
    <div class="column is-4-desktop is-6-tablet">
      <div class="card">
        <header class="card-header">
          <p class="card-header-title is-centered">
            Login
          </p>
        </header>
        <div class="card-content">
          <div class="content">
            <form @submit.prevent="handleLogin">
              <div class="field">
                <label class="label">Username</label>
                <div class="control">
                  <input 
                    class="input" 
                    type="text" 
                    placeholder="Enter your username" 
                    v-model="username" 
                    required
                  >
            
                </div>
              </div>

              <div class="field">
                <label class="label">Password</label>
                <div class="control">
                  <input 
                    class="input" 
                    type="password" 
                    placeholder="Enter your password" 
                    v-model="password" 
                    required
                  >
                 
                </div>
              </div>
              
              <div v-if="error" class="notification is-danger is-light">
                {{ error }}
              </div>

              <div class="field mt-5">
                <div class="control">
                  <button 
                    class="button is-primary is-fullwidth" 
                    :class="{ 'is-loading': isLoading }"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
