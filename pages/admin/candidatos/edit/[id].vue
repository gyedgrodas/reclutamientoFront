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
  <div>
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">EDICIÓN · CANDIDATO #{{ route.params.id }}</span>
        <h1 class="tt-page-title">
          {{ registro ? `${registro.nombres} ${registro.apellidos}` : 'Editar candidato' }}
        </h1>
        <p class="tt-page-subtitle">
          Actualice datos personales, formación, pretensión salarial o estado en el banco de talento.
        </p>
      </div>
      <VBtn
        color="secondary"
        variant="tonal"
        prepend-icon="tabler-arrow-left"
        to="/admin/candidatos"
      >
        Volver a candidatos
      </VBtn>
    </header>

    <section class="tt-panel pa-6">
      <VProgressLinear
        v-if="cargando"
        indeterminate
        color="success"
      />
      <Fields
        v-else-if="registro"
        :candidato="registro"
        :guardando="guardando"
        @guardar="guardar"
      />
      <div v-else>
        No fue posible cargar el candidato.
        <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>
    </section>
  </div>
</template>

<style scoped>
@import '@/assets/styles/reclutamiento-talent.scss';
</style>
