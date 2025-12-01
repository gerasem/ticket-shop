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
  background-color: var(--color-accent);
  color: var(--color-text-white);
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: var(--color-accent-hover);
}

.btn-secondary {
  background-color: var(--color-bg-tertiary);
}

.btn-secondary:hover {
  background-color: var(--color-border);
}
</style>
