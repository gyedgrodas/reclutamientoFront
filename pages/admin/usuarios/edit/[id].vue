<script setup lang="ts">
import UserFields from '@/views/pages/usuarios/fields.vue'
import type { DatosUsuario, UsuarioGestion } from '@/types/usuarios/gestion'

definePageMeta({ navActiveLink: 'admin-usuarios', middleware: 'permissions', action: 'editar usuarios', subject: 'User' })

const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const route = useRoute()
const usuario = ref<UsuarioGestion | null>(null)
const guardando = ref(false)
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

const guardar = async (datos: DatosUsuario) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await put<{ message: string }>(`/api/users/${route.params.id}`, datos)

    showToastSuccess(respuesta.message)
    await navigateTo('/admin/usuarios')
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <VCard title="Editar usuario">
    <VCardText>
      <VProgressLinear v-if="cargando" indeterminate />
      <UserFields v-else-if="usuario" :usuario="usuario" :guardando="guardando" @guardar="guardar" />
      <div v-else>No fue posible cargar el usuario. <VBtn variant="text" @click="cargar">Reintentar</VBtn></div>
    </VCardText>
  </VCard>
</template>
