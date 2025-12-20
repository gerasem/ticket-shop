<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const errorMsg = ref('');

const handleSubmit = async () => {
    errorMsg.value = '';
    
    const result = await authStore.login(username.value, password.value);
    
    if (result === true) {
        router.push('/admin');
    } else {
        errorMsg.value = result;
    }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Admin Login</h2>
      
      <p class="description">
        Please login to access the admin area.
      </p>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Username</label>
          <input type="text" v-model="username" required placeholder="Enter username" />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="password" required placeholder="Enter password" />
        </div>
        
        <div class="error-msg" v-if="errorMsg">{{ errorMsg }}</div>

        <button type="submit" class="submit-btn">Login</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px); /* Adjust for header if exists */
  background-color: var(--color-bg-primary);
}

.auth-card {
  background: var(--color-bg-panel);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--color-border-light);
}

h2 {
  text-align: center;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

.description {
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  background: var(--color-bg-secondary);
  padding: 0.5rem;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  box-sizing: border-box; /* Important for padding */
}

input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: opacity 0.2s;
}

.submit-btn:hover {
  opacity: 0.9;
}

.error-msg {
  color: #ef4444;
  margin-top: 0.5rem;
  text-align: center;
  font-size: 0.9rem;
}
</style>
