<script setup lang="ts">
import Fields from '@/views/pages/reclutamiento/vacantes/fields.vue'
import type { DatosVacante, Vacante } from '@/types/reclutamiento'

definePageMeta({ navActiveLink: 'admin-vacantes', middleware: 'permissions', action: 'editar vacantes', subject: 'Vacante' })

const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const route = useRoute()
const registro = ref<Vacante | null>(null)
const guardando = ref(false)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Vacante }>(`/api/vacantes/${route.params.id}?include=puesto,unidad,solicitante`)

    registro.value = respuesta.data
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

const guardar = async (datos: DatosVacante) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await put<{ message: string }>(`/api/vacantes/${route.params.id}`, datos)

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

onMounted(cargar)
</script>

<template>
  <VCard title="Editar vacante">
    <VCardText>
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />
      <Fields
        v-else-if="registro"
        :vacante="registro"
        :guardando="guardando"
        @guardar="guardar"
      />
      <div v-else>
        No fue posible cargar la vacante. <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>
