<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const errorMsg = ref('');

const handleSubmit = async () => {
    errorMsg.value = '';
    
    const result = await authStore.login(username.value, password.value);
    
    if (result === true) {
        router.push('/admin/events');
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
          <Label>Username</Label>
          <Input type="text" v-model="username" required placeholder="Enter username" />
        </div>
        
        <div class="form-group">
          <Label>Password</Label>
          <Input type="password" v-model="password" required placeholder="Enter password" />
        </div>
        
        <div class="error-msg" v-if="errorMsg">{{ errorMsg }}</div>

        <Button type="submit" class="w-full mt-4" variant="primary">Login</Button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px); /* Adjust for header */
  background-color: var(--bg-secondary); /* Light gray background */
}

.auth-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--border-primary);
}

h2 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 700;
}

.description {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error-msg {
  background: var(--error-light);
  color: var(--error);
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
  border: 1px solid var(--error-border);
}
</style>
