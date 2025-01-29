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
  <div class="container mt-5">
    <div class="d-flex justify-content-between">
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
    <VCard>
      <VCardText>
        <DataTablePermisos ref="dataTablePermisos" />
      </VCardText>
    </VCard>
  </div>
</template>
