<script setup lang="ts">
import Fields from '@/views/pages/reclutamiento/candidatos/fields.vue'
import type { DatosCandidato } from '@/types/reclutamiento'

definePageMeta({ navActiveLink: 'admin-candidatos', middleware: 'permissions', action: 'crear candidatos', subject: 'Candidato' })

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)

const guardar = async (datos: DatosCandidato) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/candidatos', datos)

    showToastSuccess(respuesta.message)
    await navigateTo('/admin/candidatos')
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
  <VCard title="Registrar candidato">
    <VCardText>
      <Fields
        :guardando="guardando"
        @guardar="guardar"
      />
    </VCardText>
  </VCard>
</template>
