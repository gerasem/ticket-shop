<script setup lang="ts">
</script>

<template>
  <div class="home">
    <h1>Welcome to Ticket Shop</h1>
    <p>Select a role to proceed:</p>
    <div class="actions">
      <RouterLink to="/client" class="btn">Book Tickets</RouterLink>
      <RouterLink to="/admin" class="btn btn-secondary">Manage Venue</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
  padding: 4rem 0;
}

.actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #42b983;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #3aa876;
}

.btn-secondary {
  background-color: #2c3e50;
}

.btn-secondary:hover {
  background-color: #243442;
}
</style>
