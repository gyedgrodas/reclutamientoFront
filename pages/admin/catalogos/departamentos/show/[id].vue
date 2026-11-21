<script setup lang="ts">
import type { Departamento, Pais } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-departamentos', middleware: 'permissions', action: 'ver departamentos', subject: 'Departamento' })

const { get } = useClienteRequest()
const route = useRoute()
const registro = ref<Departamento | null>(null)
const pais = ref<Pais | null>(null)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Departamento }>(`/api/catalogo/departamentos/${route.params.id}`)

    registro.value = respuesta.data
    try {
      pais.value = (await get<{ data: Pais }>(`/api/catalogo/paises/${respuesta.data.pais_id}`)).data
    }
    catch {
      pais.value = null // Sin permiso de ver países se muestra solo el id
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
  <VCard title="Detalle del departamento">
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
          <strong>País:</strong> {{ pais?.nombre ?? registro.pais_id }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Estado:</strong> {{ registro.estado }}
        </VCol>
      </VRow>
      <div v-else>
        No fue posible cargar el departamento. <VBtn
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
        to="/admin/catalogos/departamentos"
      >
        Regresar
      </VBtn>
    </VCardText>
  </VCard>
</template>
