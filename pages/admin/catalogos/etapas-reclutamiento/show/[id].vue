<script setup lang="ts">
import type { EtapaReclutamiento } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-etapas-reclutamiento', middleware: 'permissions', action: 'ver etapas-reclutamiento', subject: 'EtapaReclutamiento' })

const { get } = useClienteRequest()
const route = useRoute()
const registro = ref<EtapaReclutamiento | null>(null)
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

onMounted(cargar)
</script>

<template>
  <VCard title="Detalle de la etapa de reclutamiento">
    <VCardText>
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />
      <VRow v-else-if="registro">
        <VCol
          cols="12"
          md="6"
        >
          <strong>Nombre:</strong> {{ registro.nombre }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Orden:</strong> {{ registro.orden }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Estado público:</strong> {{ registro.estado_publico || '—' }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Terminal:</strong> {{ registro.es_terminal ? 'Sí' : 'No' }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Estado:</strong> {{ registro.estado }}
        </VCol>
      </VRow>
      <div v-else>
        No fue posible cargar la etapa. <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>
      <VBtn
        class="mt-4"
        color="secondary"
        variant="tonal"
        to="/admin/catalogos/etapas-reclutamiento"
      >
        Regresar
      </VBtn>
    </VCardText>
  </VCard>
</template>
