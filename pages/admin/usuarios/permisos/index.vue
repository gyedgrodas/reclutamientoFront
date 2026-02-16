<script setup lang="ts">
import { ref } from 'vue'
import { can } from '@layouts/plugins/casl'
import DataTablePermisos from '@/views/pages/usuarios/permisos/dataTablePermisos.vue'

const dataTablePermisos = ref()

const abrirCreateModal = () => {
  if (dataTablePermisos.value)
    dataTablePermisos.value.openDialog(false)
}

definePageMeta({
  navActiveLink: 'usuarios-permisos',
  middleware: 'permissions',
  action: 'listar permisos', // Acción requerida
  subject: 'Permission',
})
</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between mb-6">
    <h1>Gestión de Permisos</h1>
    <VBtn
      v-if="can('crear permisos', 'Permission')"
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
