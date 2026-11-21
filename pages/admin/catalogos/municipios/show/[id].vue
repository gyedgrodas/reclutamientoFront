<script setup lang="ts">
import type { Departamento, Municipio, Pais } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-municipios', middleware: 'permissions', action: 'ver municipios', subject: 'Municipio' })

const { get } = useClienteRequest()
const route = useRoute()
const registro = ref<Municipio | null>(null)
const departamento = ref<Departamento | null>(null)
const pais = ref<Pais | null>(null)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Municipio }>(`/api/catalogo/municipios/${route.params.id}`)

    registro.value = respuesta.data
    try {
      departamento.value = (await get<{ data: Departamento }>(`/api/catalogo/departamentos/${respuesta.data.departamento_id}`)).data
      pais.value = (await get<{ data: Pais }>(`/api/catalogo/paises/${departamento.value.pais_id}`)).data
    }
    catch {
      // Sin permiso para ver departamentos o países se muestra el dato disponible
    }
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
  <VCard title="Detalle del municipio">
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
          <strong>Departamento:</strong> {{ departamento?.nombre ?? registro.departamento_id }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>País:</strong> {{ pais?.nombre ?? '—' }}
        </VCol>
      </VRow>
      <div v-else>
        No fue posible cargar el municipio. <VBtn
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
        to="/admin/catalogos/municipios"
      >
        Regresar
      </VBtn>
    </VCardText>
  </VCard>
</template>
