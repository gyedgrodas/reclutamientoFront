<script setup lang="ts">
import UserFields from '@/views/pages/usuarios/fields.vue'
import type { DatosUsuario } from '@/types/usuarios/gestion'

definePageMeta({ navActiveLink: 'admin-usuarios', middleware: 'permissions', action: 'crear usuarios', subject: 'User' })

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)

const guardar = async (datos: DatosUsuario) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/users', datos)

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
</script>

<template>
  <VCard title="Crear usuario">
    <VCardText><UserFields :guardando="guardando" @guardar="guardar" /></VCardText>
  </VCard>
</template>
