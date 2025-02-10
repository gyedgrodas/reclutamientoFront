<script setup lang="ts">
import { ref } from 'vue'
import DataTablePermisos from '@/views/pages/usuarios/permisos/dataTablePermisos.vue'

const dataTablePermisos = ref()

const abrirCreateModal = () => {
  if (dataTablePermisos.value)
    dataTablePermisos.value.openDialog(false)
}
</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between mb-6">
    <h1>Gestión de Permisos</h1>
    <VBtn
      class="ms-auto"
      style="inline-size: 18rem;"
      prepend-icon="tabler-plus"
      @click="abrirCreateModal"
    >
      Nuevo Permiso
    </VBtn>
  </div>
  <DataTablePermisos ref="dataTablePermisos" />
</template>
