<script setup lang="ts">
import Fields from '@/views/pages/reclutamiento/candidatos/fields.vue'
import type { Candidato, DatosCandidato } from '@/types/reclutamiento'

definePageMeta({ navActiveLink: 'admin-candidatos', middleware: 'permissions', action: 'editar candidatos', subject: 'Candidato' })

const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const route = useRoute()
const registro = ref<Candidato | null>(null)
const guardando = ref(false)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Candidato }>(`/api/candidatos/${route.params.id}?include=municipio`)

    registro.value = respuesta.data
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

const guardar = async (datos: DatosCandidato) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await put<{ message: string }>(`/api/candidatos/${route.params.id}`, datos)

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

onMounted(cargar)
</script>

<template>
  <VCard title="Editar candidato">
    <VCardText>
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />
      <Fields
        v-else-if="registro"
        :candidato="registro"
        :guardando="guardando"
        @guardar="guardar"
      />
      <div v-else>
        No fue posible cargar el candidato. <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>
