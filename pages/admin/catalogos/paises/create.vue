<script setup lang="ts">
import Fields from '@/views/pages/catalogos/paises/fields.vue'
import type { DatosPais } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-paises', middleware: 'permissions', action: 'crear paises', subject: 'Pais' })

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)

const guardar = async (datos: DatosPais) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/catalogo/paises', datos)

    showToastSuccess(respuesta.message)
    await navigateTo('/admin/catalogos/paises')
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
  <VCard title="Crear país">
    <VCardText>
      <Fields
        :guardando="guardando"
        @guardar="guardar"
      />
    </VCardText>
  </VCard>
</template>
