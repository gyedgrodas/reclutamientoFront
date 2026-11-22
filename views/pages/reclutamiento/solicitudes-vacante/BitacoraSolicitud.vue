<script setup lang="ts">
interface EventoBitacora {
  id: number
  seccion: string
  titulo: string
  comentario: string
  icono: string
  color: string
  created_at: string
  usuario: { nombres: string; apellidos: string; usuario_dominio: string } | null
}

interface PaginaBitacora {
  data: EventoBitacora[]
  current_page: number
  last_page: number
  total: number
}

const props = defineProps<{ solicitudId: number | string; version: number }>()
const { get } = useClienteRequest()
const eventos = ref<EventoBitacora[]>([])
const pagina = ref(1)
const ultimaPagina = ref(1)
const total = ref(0)
const cargando = ref(false)
const errorCarga = ref<string | null>(null)
let secuencia = 0

const cargar = async () => {
  const actual = ++secuencia

  cargando.value = true
  errorCarga.value = null
  try {
    const respuesta = await get<{ data: PaginaBitacora }>(`/api/solicitudes-vacante/${props.solicitudId}/bitacora`, {
      params: { 'page[number]': pagina.value, 'page[size]': 10 },
    })

    if (actual !== secuencia)
      return
    if (!respuesta?.data || !Array.isArray(respuesta.data.data))
      throw new Error('La respuesta de la bitácora no tiene el formato esperado.')
    eventos.value = respuesta.data.data
    pagina.value = respuesta.data.current_page
    ultimaPagina.value = respuesta.data.last_page
    total.value = respuesta.data.total
  }
  catch (error: any) {
    if (actual !== secuencia)
      return
    errorCarga.value = error?.response?.data?.message || error?.message || 'No se pudo cargar la bitácora.'
  }
  finally {
    if (actual === secuencia)
      cargando.value = false
  }
}

const nombreUsuario = (usuario: EventoBitacora['usuario']) =>
  usuario ? `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim() || usuario.usuario_dominio : 'Usuario no disponible'

const fecha = (valor: string) => {
  const fechaEvento = new Date(valor)

  return Number.isNaN(fechaEvento.getTime()) ? valor : new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' }).format(fechaEvento)
}

watch(() => [props.solicitudId, props.version], () => {
  pagina.value = 1
  cargar()
}, { immediate: true })

onBeforeUnmount(() => {
  secuencia++
})
</script>

<template>
  <section
    class="tt-panel pa-6 mt-6"
    aria-labelledby="titulo-bitacora"
  >
    <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-5">
      <div>
        <span class="tt-eyebrow">TRAZABILIDAD</span>
        <h2
          id="titulo-bitacora"
          class="text-h6 font-weight-bold mb-0"
        >
          Bitácora de la solicitud
        </h2>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Acciones registradas en esta solicitud y su vacante vinculada.
        </p>
      </div>
      <VChip
        color="primary"
        variant="tonal"
        size="small"
      >
        {{ total }} {{ total === 1 ? 'evento' : 'eventos' }}
      </VChip>
    </div>

    <VProgressLinear
      v-if="cargando"
      indeterminate
      color="primary"
      class="mb-4"
    />
    <VAlert
      v-if="errorCarga"
      type="error"
      variant="tonal"
    >
      {{ errorCarga }}
      <VBtn
        size="small"
        variant="text"
        @click="cargar"
      >
        Reintentar
      </VBtn>
    </VAlert>
    <p
      v-else-if="!cargando && !eventos.length"
      class="text-body-2 text-medium-emphasis mb-0"
    >
      No hay eventos registrados para esta solicitud.
    </p>
    <div
      v-else
      class="eventos-bitacora"
    >
      <article
        v-for="evento in eventos"
        :key="evento.id"
        class="evento-bitacora"
      >
        <VAvatar
          :color="evento.color"
          variant="tonal"
          size="38"
        >
          <VIcon
            :icon="evento.icono"
            size="19"
          />
        </VAvatar>
        <div class="evento-bitacora__contenido">
          <div class="d-flex align-center justify-space-between flex-wrap gap-2">
            <strong>{{ evento.titulo }}</strong>
            <time
              class="text-caption text-medium-emphasis"
              :datetime="evento.created_at"
            >{{ fecha(evento.created_at) }}</time>
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ evento.seccion }} · {{ nombreUsuario(evento.usuario) }}
          </div>
          <p class="text-body-2 mt-2 mb-0 comentario-bitacora">
            {{ evento.comentario }}
          </p>
        </div>
      </article>
    </div>
    <VPagination
      v-if="ultimaPagina > 1"
      v-model="pagina"
      :length="ultimaPagina"
      :disabled="cargando"
      class="mt-4"
      @update:model-value="cargar"
    />
  </section>
</template>

<style scoped>
@import "@styles/reclutamiento-talent.scss";

.eventos-bitacora { display: grid; gap: 16px; }
.evento-bitacora { display: flex; gap: 12px; align-items: flex-start; }
.evento-bitacora__contenido { flex: 1; min-width: 0; }
.comentario-bitacora { overflow-wrap: anywhere; white-space: pre-line; }
</style>
