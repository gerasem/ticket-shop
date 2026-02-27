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
        router.push('/admin/events');
    } else {
        errorMsg.value = result;
    }
};
</script>

<template>
  <div class="auth-container">
    <div class="box auth-card">
      <h2 class="title is-4 has-text-centered mb-2">Admin Login</h2>
      
      <p class="subtitle is-6 has-text-centered has-text-grey mb-5">
        Please login to access the admin area.
      </p>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label class="label">Username</label>
          <div class="control">
            <input class="input" type="text" v-model="username" required placeholder="Enter username" />
          </div>
        </div>
        
        <div class="field">
          <label class="label">Password</label>
          <div class="control">
            <input class="input" type="password" v-model="password" required placeholder="Enter password" />
          </div>
        </div>
        
        <div class="notification is-danger is-light mt-4 p-3 has-text-centered is-size-7" v-if="errorMsg">
          {{ errorMsg }}
        </div>

        <div class="field mt-5">
          <div class="control">
            <button type="submit" class="button is-primary is-fullwidth">Login</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px); /* Adjust for header */
  background-color: var(--bg-secondary); /* Light gray background */
}

.auth-card {
  width: 100%;
  max-width: 400px;
}
</style>
