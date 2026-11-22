<script setup lang="ts">
import Fields from '@/views/pages/reclutamiento/vacantes/fields.vue'
import type { DatosVacante } from '@/types/reclutamiento'

definePageMeta({ navActiveLink: 'admin-vacantes', middleware: 'permissions', action: 'crear vacantes', subject: 'Vacante' })

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)

const guardar = async (datos: DatosVacante) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/vacantes', datos)

    showToastSuccess(respuesta.message)
    await navigateTo('/admin/vacantes')
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
  <VCard title="Crear vacante">
    <VCardText>
      <Fields
        :guardando="guardando"
        @guardar="guardar"
      />
    </VCardText>
  </VCard>
</template>
