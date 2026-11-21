<script setup lang="ts">
import Fields from '@/views/pages/catalogos/etapas-reclutamiento/fields.vue'
import type { DatosEtapaReclutamiento } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-etapas-reclutamiento', middleware: 'permissions', action: 'crear etapas-reclutamiento', subject: 'EtapaReclutamiento' })

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)

const guardar = async (datos: DatosEtapaReclutamiento) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/catalogo/etapas-reclutamiento', datos)

    showToastSuccess(respuesta.message)
    await navigateTo('/admin/catalogos/etapas-reclutamiento')
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
  <VCard title="Crear etapa de reclutamiento">
    <VCardText>
      <Fields
        :guardando="guardando"
        @guardar="guardar"
      />
    </VCardText>
  </VCard>
</template>
