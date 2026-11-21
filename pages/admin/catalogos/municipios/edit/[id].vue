<script setup lang="ts">
import Fields from '@/views/pages/catalogos/municipios/fields.vue'
import type { DatosMunicipio, Municipio } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-municipios', middleware: 'permissions', action: 'editar municipios', subject: 'Municipio' })

const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const route = useRoute()
const registro = ref<Municipio | null>(null)
const guardando = ref(false)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Municipio }>(`/api/catalogo/municipios/${route.params.id}`)

    registro.value = respuesta.data
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

const guardar = async (datos: DatosMunicipio) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await put<{ message: string }>(`/api/catalogo/municipios/${route.params.id}`, datos)

    showToastSuccess(respuesta.message)
    await navigateTo('/admin/catalogos/municipios')
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
  <VCard title="Editar municipio">
    <VCardText>
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />
      <Fields
        v-else-if="registro"
        :municipio="registro"
        :guardando="guardando"
        @guardar="guardar"
      />
      <div v-else>
        No fue posible cargar el municipio. <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>
