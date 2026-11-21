<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes'
import type DataTableComponent from '@/components/DataTableComponent.vue'
import { MODEL_TYPE_USER } from '@/constantes/ModelTypes'

definePageMeta({
  navActiveLink: 'admin-usuarios',
  middleware: 'permissions',
  action: 'listar usuarios',
  subject: 'User',
})

const { deleted } = useClienteRequest()
const { showToastSuccess, preguntaEliminar } = useToast()
const dataTable = ref<InstanceType<typeof DataTableComponent> | null>(null)
const filtros = ref({ usuario_dominio: '', nombres: '', apellidos: '', correo: '', estado: null as string | null })
const estados = [{ title: 'Activo', value: 'activo' }, { title: 'Inactivo', value: 'inactivo' }]

const columnas = computed<ColumnaInterface[]>(() => [
  { title: 'ID', key: 'id' },
  { title: 'Usuario', key: 'usuario_dominio', OpcionesFiltro: { operador: 'like', valor: filtros.value.usuario_dominio } },
  { title: 'Nombres', key: 'nombres', OpcionesFiltro: { operador: 'like', valor: filtros.value.nombres } },
  { title: 'Apellidos', key: 'apellidos', OpcionesFiltro: { operador: 'like', valor: filtros.value.apellidos } },
  { title: 'Correo', key: 'correo', OpcionesFiltro: { operador: 'like', valor: filtros.value.correo } },
  { title: 'Estado', key: 'estado', OpcionesFiltro: { operador: '=', valor: filtros.value.estado } },
  { title: 'Creado', key: 'creado_en' },
  { title: 'Acciones', key: 'acciones', sortable: false },
])

const limpiar = () => {
  filtros.value = { usuario_dominio: '', nombres: '', apellidos: '', correo: '', estado: null }
  dataTable.value?.filtrar()
}

const eliminar = async (id: number) => {
  if (!await preguntaEliminar('¿Desea eliminar este usuario?'))
    return

  try {
    const respuesta = await deleted<{ message: string }>(`/api/users/${id}`)

    showToastSuccess(respuesta.message)
    await dataTable.value?.filtrar()
  }
  catch (error) {
    manejaError(error)
  }
}
</script>

<template>
  <div class="d-flex flex-wrap justify-space-between align-center mb-6">
    <h1>Gestión de usuarios</h1>
    <VBtn v-if="can('crear usuarios', 'User')" prepend-icon="tabler-plus" to="/admin/usuarios/create">
      Nuevo usuario
    </VBtn>
  </div>
  <VCard class="mb-4">
    <VCardText>
      <VRow>
        <VCol cols="12" md="3"><AppTextField v-model="filtros.usuario_dominio" label="Usuario" /></VCol>
        <VCol cols="12" md="3"><AppTextField v-model="filtros.nombres" label="Nombres" /></VCol>
        <VCol cols="12" md="3"><AppTextField v-model="filtros.apellidos" label="Apellidos" /></VCol>
        <VCol cols="12" md="3"><AppTextField v-model="filtros.correo" label="Correo" /></VCol>
        <VCol cols="12" md="3"><AppSelect v-model="filtros.estado" :items="estados" label="Estado" clearable /></VCol>
        <VCol cols="12" class="d-flex gap-2">
          <VBtn @click="dataTable?.filtrar()">Filtrar</VBtn>
          <VBtn color="secondary" variant="tonal" @click="limpiar">Limpiar</VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
  <DataTableComponent
    ref="dataTable" :model="MODEL_TYPE_USER" :columnas="columnas"
    :botones="['reiniciar']" :cantidad-por-pagina="10" endpoint="/api/users"
    placeholder="No se encontraron usuarios"
  >
    <template #item.estado="{ item }">
      <VChip :color="item.estado === 'activo' ? 'success' : 'secondary'" size="small">
        {{ item.estado === 'activo' ? 'Activo' : 'Inactivo' }}
      </VChip>
    </template>
    <template #item.creado_en="{ item }">
      {{ item.creado_en ? formatearFecha(item.creado_en) : '' }}
    </template>
    <template #item.acciones="{ item }">
      <VBtn v-if="can('listar usuarios', 'User')" icon="tabler-eye" variant="text" title="Ver" :to="`/admin/usuarios/show/${item.id}`" />
      <VBtn v-if="can('editar usuarios', 'User')" icon="tabler-edit" variant="text" title="Editar" :to="`/admin/usuarios/edit/${item.id}`" />
      <VBtn v-if="can('eliminar usuarios', 'User')" icon="tabler-trash" variant="text" title="Eliminar" @click="eliminar(item.id)" />
    </template>
  </DataTableComponent>
</template>
