<template>
  <div>
    <p>Permisos del usuario:</p>
    <ul>
      <li v-for="permiso in permisos" :key="permiso">{{ permiso }}</li>
    </ul>
    <button v-if="hasCreatePermission" @click="crearRecurso">Crear Recurso</button>
  </div>
</template>

<script setup>
import {usePermisoStore} from '@/stores/permisos';

const permisoStore = usePermisoStore();
const {permisos} = permisoStore;

// Ejemplo: Verificar si el usuario tiene un permiso específico
const hasCreatePermission = permisos.includes('crear_recurso');

// Acción de ejemplo
const crearRecurso = () => {
  console.log('Recurso creado');
};
</script>
