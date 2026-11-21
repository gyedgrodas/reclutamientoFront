<script setup lang="ts">
import Fields from '@/views/pages/catalogos/paises/fields.vue'
import type { DatosPais, Pais } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-paises', middleware: 'permissions', action: 'editar paises', subject: 'Pais' })

const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const route = useRoute()
const registro = ref<Pais | null>(null)
const guardando = ref(false)
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

const guardar = async (datos: DatosPais) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await put<{ message: string }>(`/api/catalogo/paises/${route.params.id}`, datos)

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

onMounted(cargar)
</script>

<template>
  <VCard title="Editar país">
    <VCardText>
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />
      <Fields
        v-else-if="registro"
        :pais="registro"
        :guardando="guardando"
        @guardar="guardar"
      />
      <div v-else>
        No fue posible cargar el país. <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>
