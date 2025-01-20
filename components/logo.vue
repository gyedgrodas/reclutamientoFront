<template>
  <div class="logo-container">
    <svg class="logo" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <!-- Hojas del árbol -->
      <g class="leaves">
        <circle v-for="(leaf, index) in leaves" :key="index" :cx="leaf.x"
                :cy="leaf.y" :r="leaf.r" class="leaf" fill="green"/>
      </g>
      <!-- Tronco del árbol -->
      <rect fill="#2d2d2d" height="50" width="20" x="140" y="70"/>
      <!-- Persona -->
      <circle cx="150" cy="65" fill="#2d2d2d" r="5"/>
      <!-- Texto -->
      <text fill="#333" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" x="90" y="140">
        GUAYACÁN
      </text>
    </svg>
  </div>
</template>

<script>
export default {
  name: "GuayacanLogo",
  data() {
    return {
      // Configuración de las hojas
      leaves: [
        {x: 120, y: 50, r: 5},
        {x: 130, y: 40, r: 5},
        {x: 140, y: 30, r: 5},
        {x: 150, y: 20, r: 5},
        {x: 160, y: 30, r: 5},
        {x: 170, y: 40, r: 5},
        {x: 180, y: 50, r: 5},
        {x: 130, y: 60, r: 5},
        {x: 140, y: 50, r: 5},
        {x: 160, y: 50, r: 5},
        {x: 170, y: 60, r: 5}
      ],
    };
  },
};
</script>

<style scoped>
.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f4f4;
  margin: 0;
}

.logo {
  width: 400px;
  height: auto;
}

.leaf {
  animation: blink 2s infinite ease-in-out;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.2);
  }
}

/* Variación en los tiempos de animación */
.leaf:nth-child(odd) {
  animation-delay: 0.3s;
}

.leaf:nth-child(even) {
  animation-delay: 0.6s;
}
</style>
