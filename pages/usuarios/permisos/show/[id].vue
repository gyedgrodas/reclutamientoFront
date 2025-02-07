<script setup lang="ts">

import { ref } from 'vue'

const { showToastError } = useToast()
const { get } = useClienteRequest()
const { paginaEspera } = useCargandoPagina()

const route = useRoute()

const id = route.params.id

const roles = ref<any[]>([])
const nombreRoles = ref<string[]>([])
const permisos = ref<{ name?: string; guard_name?: string }>({})

const cargarPermisos = async () => {
  try {
    paginaEspera.value = true

    const response: any = await get(`/api/permisos/${id}`)

    permisos.value = response.data
    paginaEspera.value = false
  }
  catch (error) {
    console.error('Error al cargar los permisos:', error)
    showToastError('Error al cargar los permisos')
    paginaEspera.value = false
  }
}

const cargarRoles = async () => {
  try {
    const response: any = await get(`/api/permisos/${id}/roles`)

    roles.value = response.data

    nombreRoles.value = roles.value.map((role: any) => role.name)
  }
  catch (error) {
    showToastError('Error al cargar los roles del permiso')
    console.error('Error al cargar los roles del permiso:', error)
    paginaEspera.value = false
  }
}

cargarPermisos()
cargarRoles()
</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="primary"
      to="/usuarios/permisos"
    >
      Regresar
    </VBtn>
  </div>
  <VCard>
    <VCardItem>
      <VCardTitle>Mostrar Permiso</VCardTitle>
    </VCardItem>
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          sm="6"
        >
          <AppTextField
            v-model="permisos.name"
            label="Nombre"
            readonly
          />
        </VCol>
        <VCol
          cols="12"
          sm="6"
        >
          <AppTextField
            v-model="permisos.guard_name"
            label="Guard Name"
            readonly
          />
        </VCol>
      </VRow>
    </vcardtext>
    <VCardText>
      <VCardTitle>Roles</VCardTitle>
      <VChip
        v-for="(role, index) in nombreRoles"
        :key="index"
        color="primary"
        class="ma-1"
      >
        {{ role }}
      </VChip>
    </VCardText>
  </vcard>
</template>

<style scoped lang="scss">

</style>
