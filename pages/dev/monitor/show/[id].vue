<script setup lang="ts">
import type { SendResponseInterface } from '@/types/sistema/types'

definePageMeta({
  navActiveLink: 'dev-monitor',
  middleware: 'permissions',
  action: 'listar jobs',
  subject: 'Job',
})

const { get } = useClienteRequest()
const { paginaEspera } = useCargandoPagina()
const route = useRoute()
const id = route.params.id

const jobs = ref<any[]>([])
const total = ref<any[]>([])
const visibleCount = ref(3)

const visibleLogs = computed(() => jobs.value.slice(0, visibleCount.value))
const hayMas = ref(false)
const cargarMas = async () => {
  visibleCount.value += 3
  await getLogs()
}
const estadoTexto = (status: number) => {
  switch (status) {
    case 0: return { texto: 'En ejecución', color: 'info', icono: 'tabler-loader' }
    case 1: return { texto: 'Exitoso', color: 'success', icono: 'tabler-check' }
    case 2: return { texto: 'Fallido', color: 'error', icono: 'tabler-x' }
    case 3: return { texto: 'Expirado', color: 'warning', icono: 'tabler-clock-off' }
    case 4: return { texto: 'En cola', color: 'secondary', icono: 'tabler-clock' }
    default: return { texto: 'Desconocido', color: 'secondary', icono: 'tabler-help' }
  }
}

const getLogs = async () => {
  try {
    paginaEspera.value = true
    const res = await get<SendResponseInterface<any>>(
      `api/configuracion/monitor/jobs/show/${id}?limit=${visibleCount.value}`
    )

    jobs.value = res.data.items ?? []
    total.value = res.data.total ?? 0
    hayMas.value = res.data.has_more ?? false
  } catch (e: any) {
    manejaError(e)
  } finally {
    paginaEspera.value = false
  }
}

const totalEventos = computed(() => total.value)
const numeroEvento = (index: number) => totalEventos.value - index

const formatoFechaCorta = (fecha: string) => {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-ES')
}

const mostrarModalError = ref(false)
const errorSeleccionado = ref<string | null>(null)

const abrirError = (item: any) => {
  errorSeleccionado.value = item.exception || item.exception_message
  mostrarModalError.value = true
}

const cerrarError = () => {
  mostrarModalError.value = false
  errorSeleccionado.value = null
}

onMounted(getLogs)
</script>

<template>
  <!-- HEADER -->
  <div class="d-flex justify-space-between align-center mb-6">
    <h1>Detalle de la Tarea</h1>

    <VBtn
      class="ml-auto"
      color="secondary"
      to="/dev/monitor"
    >
      <VIcon class="tabler-arrow-back-up mr-1" />
      Regresar
    </VBtn>
  </div>

  <!-- LISTA -->
  <div class="job-list">
    <div
      v-for="(item, index) in visibleLogs"
      :key="index"
      class="job-row"
    >
      <!-- FECHA + ICONO -->
      <div class="job-left">
        <VChip
          size="x-small"
          variant="tonal"
          :color="estadoTexto(item.status).color"
        >
          {{ formatoFechaCorta(item.finished_at_exact || item.finished_at) }}
        </VChip>

        <VAvatar
          size="30"
          :color="estadoTexto(item.status).color"
          variant="tonal"
        >
          <VIcon :icon="estadoTexto(item.status).icono" size="18" />
        </VAvatar>
      </div>

      <!-- CARD -->
      <VCard variant="outlined" class="job-card pa-4">
        <!-- ESTADO -->
        <div class="d-flex align-center">
          <VChip
            size="small"
            :color="estadoTexto(item.status).color"
            variant="tonal"
          >
            {{ estadoTexto(item.status).texto }}
          </VChip>

          <VSpacer />

          <VChip size="small" color="primary" variant="tonal">
            {{ numeroEvento(index) }} de {{ totalEventos }}
          </VChip>
        </div>

        <!-- DIVISOR -->
        <VDivider class="my-4" />

        <!-- INFO -->
        <div class="info-block">
          <div class="info-row">
            <span class="info-title">Tarea:</span>
            <VChip size="small" color="info" variant="tonal">
              {{ item.name }}
            </VChip>
          </div>

          <div class="info-row">
            <span class="info-title">Cola:</span>
            <VChip size="small" color="primary" variant="tonal">
              {{ item.queue }}
            </VChip>
          </div>

          <div class="info-row">
            <span class="info-title">Duración:</span>
            <VChip size="small" color="gray" variant="tonal">
              {{ calcularDuracionEntreFechas(item.started_at_exact, item.finished_at_exact) }}
            </VChip>
          </div>
        </div>

        <!-- ERROR -->
        <div v-if="item.exception_message" class="mt-4">
          <!-- DIVISOR -->
          <VDivider class="my-4" />

          <VBtn
            size="small"
            color="error"
            title="Ver detalle del error"
            variant="tonal"
            prepend-icon="tabler-alert-triangle"
            class="mb-2"
            @click="abrirError(item)"
          >
            Ver detalle del error
          </VBtn>
        </div>
      </VCard>
    </div>
  </div>

  <!-- CARGAR MÁS -->
  <div class="text-center mt-6">
    <VBtn
      v-if="hayMas"
      title="Cargar más tareas"
      color="primary"
      variant="tonal"
      prepend-icon="tabler-plus"
      @click="cargarMas"
    >
      Cargar más
    </VBtn>
  </div>


  <ModalBasico
    v-model:mostrarModal="mostrarModalError"
    :titulo="'Mostrar Error'"
    max-width="1200"
    persistent
  >
    <div class="error-box">
      {{ errorSeleccionado }}
    </div>
  </ModalBasico>


</template>

<style scoped lang="scss">
.job-list {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.job-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
}

.job-left {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 6px;
}

.job-card {
  border-radius: 16px;
  background: linear-gradient(
      180deg,
      rgba(255,255,255,0.04),
      rgba(255,255,255,0)
  );
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-title {
  font-size: 13px;
  min-width: 70px;
}

.error-box {
  background: #1e1e2f;
  color: #ff8a8a;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 14px;
  border-left: 5px solid #ff5252;
  border-radius: 10px;
  white-space: pre-wrap;
}
</style>
