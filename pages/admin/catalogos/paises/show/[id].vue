<script setup lang="ts">
import type { Pais } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-paises', middleware: 'permissions', action: 'ver paises', subject: 'Pais' })

const { get } = useClienteRequest()
const route = useRoute()
const registro = ref<Pais | null>(null)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Pais }>(`/api/catalogo/paises/${route.params.id}`)

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
  <VCard title="Detalle del país">
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
          <strong>Estado:</strong> {{ registro.estado }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Código ISO2:</strong> {{ registro.codigo_iso2 }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Código ISO3:</strong> {{ registro.codigo_iso3 }}
        </VCol>
      </VRow>
      <div v-else>
        No fue posible cargar el país. <VBtn
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
        to="/admin/catalogos/paises"
      >
        Regresar
      </VBtn>
    </VCardText>
  </VCard>
</template>
