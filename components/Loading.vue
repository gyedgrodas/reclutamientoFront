<template>
  <div class="loading-container">
    <div class="spinner"></div>
    <p class="loading-text">Cargando...</p>
  </div>
</template>

<script>
export default {
  name: "LoadingSpinner",
};
</script>

<style scoped>
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: white;
  color: #000000;
  z-index: 9999;
}

.spinner {
  width: 64px;
  height: 64px;
  border: 8px solid rgb(6, 168, 1);
  border-top: 8px solid #44a840;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 16px;
  font-size: 1.25rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
