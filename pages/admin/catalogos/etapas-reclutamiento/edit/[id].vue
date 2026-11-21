<script setup lang="ts">
import Fields from '@/views/pages/catalogos/etapas-reclutamiento/fields.vue'
import type { DatosEtapaReclutamiento, EtapaReclutamiento } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-etapas-reclutamiento', middleware: 'permissions', action: 'editar etapas-reclutamiento', subject: 'EtapaReclutamiento' })

const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const route = useRoute()
const registro = ref<EtapaReclutamiento | null>(null)
const guardando = ref(false)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: EtapaReclutamiento }>(`/api/catalogo/etapas-reclutamiento/${route.params.id}`)

    registro.value = respuesta.data
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

const guardar = async (datos: DatosEtapaReclutamiento) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await put<{ message: string }>(`/api/catalogo/etapas-reclutamiento/${route.params.id}`, datos)

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

onMounted(cargar)
</script>

<template>
  <VCard title="Editar etapa de reclutamiento">
    <VCardText>
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />
      <Fields
        v-else-if="registro"
        :etapa="registro"
        :guardando="guardando"
        @guardar="guardar"
      />
      <div v-else>
        No fue posible cargar la etapa. <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>
