<script setup lang="ts">
import { ref } from 'vue'

const { showToastError } = useToast()
const { get } = useClienteRequest()
const { paginaEspera } = useCargandoPagina()

definePageMeta({
  navActiveLink: 'usuarios-roles',
  middleware: 'permissions',
  action: 'ver rol', // Acción requerida
  subject: 'Role',
})

const route = useRoute()

const id = route.params.id

const permisos = ref<any[]>([])
const nombrePermisos = ref<string[]>([])
const roles = ref<{ name?: string; guard_name?: string }>({})

const cargarRoles = async () => {
  try {
    paginaEspera.value = true

    const response: any = await get(`/api/roles/${id}`)

    roles.value = response.data
    paginaEspera.value = false
  }
  catch (error) {
    console.error('Error al cargar los roles:', error)
    showToastError('Error al cargar los roles')
    paginaEspera.value = false
  }
}

const cargarPermisosRol = async () => {
  try {
    const response: any = await get(`/api/roles/${id}/permisos`)

    permisos.value = response.data

    nombrePermisos.value = permisos.value.map((permiso: any) => permiso.name)
  }
  catch (error) {
    showToastError('Error al cargar los permisos del rol')
    console.error('Error al cargar los permisos del rol:', error)
    paginaEspera.value = false
  }
}

cargarRoles()
cargarPermisosRol()
</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="secondary"
      to="/usuarios/roles"
    >
      <VIcon class="tabler-arrow-back-up mr-1" />
      Regresar
    </VBtn>
  </div>
  <VCard>
    <VCardItem>
      <VCardTitle>Mostrar Rol</VCardTitle>
    </VCardItem>
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          sm="6"
        >
          <AppTextField
            v-model="roles.name"
            label="Nombre"
            disabled
          />
        </VCol>
        <VCol
          cols="12"
          sm="6"
        >
          <AppTextField
            v-model="roles.guard_name"
            label="Guard Name"
            disabled
          />
        </VCol>
      </VRow>
    </vcardtext>
    <VCardItem>
      <VCardTitle>Permisos</VCardTitle>
    </VCardItem>
    <VCardText>
      <VChip
        v-for="(permiso, index) in nombrePermisos"
        :key="index"
        color="primary"
        class="ma-1"
      >
        {{ permiso }}
      </VChip>
      <VChip
        v-if=" !nombrePermisos || nombrePermisos.length === 0"
        color="error"
        class="v-col-sm-12"
      >
        El Rol no cuenta con permisos actualmente asignados!!
      </VChip>
    </VCardText>
  </vcard>
</template>

<style>

</style>
