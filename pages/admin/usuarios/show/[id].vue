<script setup lang="ts">
import type { UsuarioGestion } from '@/types/usuarios/gestion'

definePageMeta({ navActiveLink: 'admin-usuarios', middleware: 'permissions', action: 'listar usuarios', subject: 'User' })

const { get } = useClienteRequest()
const route = useRoute()
const usuario = ref<UsuarioGestion | null>(null)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: UsuarioGestion }>(`/api/users/${route.params.id}`)

    usuario.value = respuesta.data
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <VCard title="Detalle del usuario">
    <VCardText>
      <VProgressLinear v-if="cargando" indeterminate />
      <VRow v-else-if="usuario">
        <VCol cols="12" md="6"><strong>Usuario:</strong> {{ usuario.usuario_dominio }}</VCol>
        <VCol cols="12" md="6"><strong>Nombre:</strong> {{ usuario.nombres }} {{ usuario.apellidos }}</VCol>
        <VCol cols="12" md="6"><strong>Correo:</strong> {{ usuario.correo }}</VCol>
        <VCol cols="12" md="6"><strong>Estado:</strong> {{ usuario.estado === 'activo' ? 'Activo' : 'Inactivo' }}</VCol>
        <VCol cols="12" md="6"><strong>Correo verificado:</strong> {{ usuario.correo_verificado_en ? formatearFecha(usuario.correo_verificado_en) : 'No verificado' }}</VCol>
        <VCol cols="12" md="6"><strong>Doble factor:</strong> {{ usuario.two_factor_habilitado ? 'Habilitado' : 'No habilitado' }}</VCol>
        <VCol cols="12" md="6"><strong>Creado:</strong> {{ usuario.creado_en ? formatearFecha(usuario.creado_en) : '—' }}</VCol>
        <VCol cols="12" md="6"><strong>Actualizado:</strong> {{ usuario.actualizado_en ? formatearFecha(usuario.actualizado_en) : '—' }}</VCol>
        <VCol cols="12"><strong>Roles:</strong> {{ usuario.roles.map(rol => rol.name).join(', ') || 'Sin roles' }}</VCol>
        <VCol cols="12"><strong>Permisos directos:</strong> {{ usuario.permissions.map(permiso => permiso.name).join(', ') || 'Sin permisos directos' }}</VCol>
      </VRow>
      <div v-else>No fue posible cargar el usuario. <VBtn variant="text" @click="cargar">Reintentar</VBtn></div>
      <VBtn class="mt-4" color="secondary" variant="tonal" to="/admin/usuarios">Regresar</VBtn>
    </VCardText>
  </VCard>
</template>
