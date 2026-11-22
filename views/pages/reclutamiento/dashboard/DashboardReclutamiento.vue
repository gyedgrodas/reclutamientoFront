<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type {
  ActividadRecientePostulacion,
  EtapaReclutamiento,
  Postulacion,
  Vacante,
} from '@/types/reclutamiento'
import DetalleSeguimientoDialog from '@/views/pages/reclutamiento/postulaciones/DetalleSeguimientoDialog.vue'
import {
  UMBRAL_DIAS_ATENCION,
  clasificarColumnaTablero,
  diasSinActualizar,
  esEtapaEntrevista,
  etiquetaDiasSinActualizar,
  inicialesPersona,
  necesitaAtencionPostulacion,
  nombreCompletoPersona,
  obtenerEtapaNombre,
  saludoEquipoTalento,
  tiempoRelativoCorto,
} from '@/utils/reclutamientoUx'

const { get } = useClienteRequest()

const cargando = ref(true)
const vacantes = ref<Vacante[]>([])
const postulaciones = ref<Postulacion[]>([])
const etapas = ref<EtapaReclutamiento[]>([])
const actividadReciente = ref<ActividadRecientePostulacion[]>([])

const busquedaTablero = ref('')
const filtroVacanteId = ref<number | null>(null)
const soloAtencion = ref(false)

const modalSeguimiento = ref(false)
const postulacionActiva = ref<Postulacion | null>(null)
const seccionInicialSeguimiento = ref<'seguimiento' | 'entrevistas'>('seguimiento')

function desempaquetarLista<T>(respuesta: any): T[] {
  if (!respuesta)
    return []

  return Array.isArray(respuesta.data) ? respuesta.data : (respuesta.data?.data || [])
}

const cargarDatos = async () => {
  cargando.value = true
  try {
    const promesas: Promise<any>[] = [
      can('ver vacantes', 'Vacante')
        ? get<any>('/api/vacantes?include=puesto,unidad,solicitante&sort=-id&page[size]=100')
        : Promise.resolve(null),
      can('ver postulaciones', 'Postulacion')
        ? get<any>('/api/postulaciones?include=candidato,vacante.puesto,vacante.unidad,etapaReclutamiento,responsable&sort=-id&page[size]=100')
        : Promise.resolve(null),
      get<any>('/api/catalogo/etapas-reclutamiento?limit=100').catch(() => null),
      can('ver postulaciones', 'Postulacion')
        ? get<any>('/api/postulaciones-actividad?limit=6').catch(() => null)
        : Promise.resolve(null),
    ]

    const [respVacantes, respPostulaciones, respEtapas, respActividad] = await Promise.all(promesas)

    vacantes.value = desempaquetarLista<Vacante>(respVacantes)
    postulaciones.value = desempaquetarLista<Postulacion>(respPostulaciones)
    etapas.value = desempaquetarLista<EtapaReclutamiento>(respEtapas).filter(etapa => etapa.estado !== 'Inactivo')
    actividadReciente.value = desempaquetarLista<ActividadRecientePostulacion>(respActividad)

    if (postulacionActiva.value) {
      const actualizada = postulaciones.value.find(p => p.id === postulacionActiva.value?.id)
      if (actualizada)
        postulacionActiva.value = actualizada
    }
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

const vacantesActivas = computed(() =>
  vacantes.value.filter(v => v.estado === 'Abierta' || v.estado === 'En Proceso'),
)

const postulacionesEnCurso = computed(() =>
  postulaciones.value.filter(p => p.estado === 'En proceso'),
)

const postulacionesEnEntrevista = computed(() =>
  postulacionesEnCurso.value.filter(p => esEtapaEntrevista(obtenerEtapaNombre(p))),
)

const radarSeguimiento = computed(() =>
  [...postulacionesEnCurso.value]
    .filter(p => necesitaAtencionPostulacion(p))
    .sort((a, b) => diasSinActualizar(b) - diasSinActualizar(a)),
)

const opcionesVacantesFiltro = computed(() => [
  { title: 'Todas las vacantes', value: null },
  ...vacantes.value.map(v => ({
    title: `${v.puesto?.nombre || `Vacante #${v.id}`}${v.unidad?.nombre ? ` · ${v.unidad.nombre}` : ''}`,
    value: v.id,
  })),
])

const postulacionesTableroFiltradas = computed(() => {
  const texto = busquedaTablero.value.trim().toLowerCase()

  return postulacionesEnCurso.value.filter(p => {
    if (filtroVacanteId.value && p.vacante_id !== filtroVacanteId.value)
      return false
    if (soloAtencion.value && !necesitaAtencionPostulacion(p))
      return false
    if (texto) {
      const candidato = nombreCompletoPersona(p.candidato).toLowerCase()
      const puesto = (p.vacante?.puesto?.nombre || '').toLowerCase()
      const unidad = (p.vacante?.unidad?.nombre || '').toLowerCase()

      if (!candidato.includes(texto) && !puesto.includes(texto) && !unidad.includes(texto))
        return false
    }

    return true
  })
})

const columnasTablero = computed(() => {
  const definiciones = [
    { id: 'recibida', titulo: 'Recibida', color: '#4a90b8' },
    { id: 'revision', titulo: 'En revisión', color: '#218268' },
    { id: 'entrevista', titulo: 'Entrevista', color: '#d08328' },
    { id: 'oferta', titulo: 'Oferta y cierre', color: '#6a67c9' },
  ] as const

  return definiciones.map(col => ({
    ...col,
    items: postulacionesTableroFiltradas.value.filter(
      p => clasificarColumnaTablero(obtenerEtapaNombre(p)) === col.id,
    ),
  }))
})

const conteoPostulacionesPorVacante = (vacante: Vacante): number => {
  if (typeof vacante.postulaciones_count === 'number')
    return vacante.postulaciones_count

  return postulaciones.value.filter(p => p.vacante_id === vacante.id).length
}

const abrirSeguimiento = (postulacion: Postulacion, seccion: 'seguimiento' | 'entrevistas' = 'seguimiento') => {
  seccionInicialSeguimiento.value = seccion
  postulacionActiva.value = postulacion
  modalSeguimiento.value = true
}

const alActualizarPostulacion = async (postulacionActualizada?: Postulacion) => {
  if (postulacionActualizada?.id) {
    if (postulacionActiva.value?.id === postulacionActualizada.id)
      postulacionActiva.value = { ...postulacionActiva.value, ...postulacionActualizada }

    const indice = postulaciones.value.findIndex(p => p.id === postulacionActualizada.id)
    if (indice !== -1)
      postulaciones.value.splice(indice, 1, { ...postulaciones.value[indice], ...postulacionActualizada })
  }

  await cargarDatos()
}

const abrirDesdeActividad = (item: ActividadRecientePostulacion) => {
  const encontrada = postulaciones.value.find(p => p.id === item.postulacion_id)
  if (encontrada)
    abrirSeguimiento(encontrada)
}

const describirActividad = (item: ActividadRecientePostulacion): string => {
  const sujeto = item.candidato || `Postulación #${item.postulacion_id}`
  if (item.tipo === 'Registro')
    return `${sujeto} ingresó a ${item.etapa_nueva || 'Solicitud recibida'}`
  if (item.etapa_nueva && item.etapa_nueva !== item.etapa_anterior)
    return `${sujeto} avanzó a ${item.etapa_nueva}`
  if (item.estado_nuevo && item.estado_nuevo !== item.estado_anterior)
    return `${sujeto} cambió a estado ${item.estado_nuevo}`

  return `Seguimiento actualizado para ${sujeto}`
}

const pasosFlujo = [
  { paso: 1, titulo: 'Crear vacante', icon: 'tabler-file-plus' },
  { paso: 2, titulo: 'Publicar', icon: 'tabler-broadcast' },
  { paso: 3, titulo: 'Recibir postulación', icon: 'tabler-inbox' },
  { paso: 4, titulo: 'Revisar expediente', icon: 'tabler-file-search' },
  { paso: 5, titulo: 'Entrevistar', icon: 'tabler-calendar-event' },
  { paso: 6, titulo: 'Evaluar', icon: 'tabler-clipboard-check' },
  { paso: 7, titulo: 'Oferta y cierre', icon: 'tabler-certificate' },
]

onMounted(cargarDatos)
</script>

<template>
  <div class="reclutamiento-dashboard">
    <!-- Encabezado ejecutivo fiel a maqueta-talento-humano.html -->
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">TU ESPACIO DE RECLUTAMIENTO · COOPERATIVA GUAYACÁN</span>
        <h1 class="tt-page-title">
          {{ saludoEquipoTalento() }}
        </h1>
        <p class="tt-page-subtitle">
          Una mirada rápida a tus procesos y a las personas que esperan una respuesta.
        </p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <VBtn
          v-if="can('ver entrevistas', 'Entrevista')"
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-calendar-event"
          to="/admin/entrevistas"
        >
          Calendario de entrevistas
        </VBtn>
        <VBtn
          v-if="can('crear vacantes', 'Vacante')"
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-plus"
          to="/admin/vacantes/create"
        >
          Nueva vacante
        </VBtn>
        <VBtn
          v-if="can('ver postulaciones', 'Postulacion')"
          color="primary"
          append-icon="tabler-arrow-right"
          to="/admin/postulaciones"
        >
          Ver procesos de selección
        </VBtn>
      </div>
    </header>

    <VProgressLinear
      v-if="cargando"
      indeterminate
      color="success"
      rounded
      class="mb-5"
    />

    <!-- 4 KPIs ejecutivos de maqueta-talento-humano.html -->
    <VRow class="mb-5">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <NuxtLink
          to="/admin/vacantes"
          class="text-decoration-none d-block h-100"
        >
          <article class="tt-stat-card tt-stat-card--interactive">
            <div class="tt-stat-top">
              <span class="tt-stat-label">Vacantes activas</span>
              <div class="tt-stat-icon">
                <VIcon
                  icon="tabler-briefcase"
                  size="18"
                />
              </div>
            </div>
            <strong class="tt-stat-value">{{ vacantesActivas.length }}</strong>
            <small class="tt-stat-foot">Procesos abiertos hoy</small>
          </article>
        </NuxtLink>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': !soloAtencion && !filtroVacanteId }"
          @click="soloAtencion = false; filtroVacanteId = null"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Postulaciones activas</span>
            <div class="tt-stat-icon tt-stat-icon--info">
              <VIcon
                icon="tabler-users"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ postulacionesEnCurso.length }}</strong>
          <small class="tt-stat-foot">En las etapas del tablero</small>
        </div>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <NuxtLink
          to="/admin/postulaciones"
          class="text-decoration-none d-block h-100"
        >
          <article class="tt-stat-card tt-stat-card--interactive">
            <div class="tt-stat-top">
              <span class="tt-stat-label">En entrevista</span>
              <div class="tt-stat-icon">
                <VIcon
                  icon="tabler-messages"
                  size="18"
                />
              </div>
            </div>
            <strong class="tt-stat-value">{{ postulacionesEnEntrevista.length }}</strong>
            <small class="tt-stat-foot">Personas en esta etapa</small>
          </article>
        </NuxtLink>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': soloAtencion }"
          @click="soloAtencion = !soloAtencion"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Necesitan atención</span>
            <div class="tt-stat-icon tt-stat-icon--warn">
              <VIcon
                icon="tabler-clock-exclamation"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ radarSeguimiento.length }}</strong>
          <small
            class="tt-stat-foot"
            :class="{ 'tt-stat-foot--warn': radarSeguimiento.length > 0 }"
          >
            {{ UMBRAL_DIAS_ATENCION }} días o más sin actualización
          </small>
        </div>
      </VCol>
    </VRow>

    <!-- Espacio de trabajo principal: Tablero de Procesos en curso + Radar de seguimiento -->
    <VRow class="mb-5">
      <VCol
        cols="12"
        lg="8"
      >
        <section class="tt-panel pa-5 h-100">
          <div class="d-flex flex-wrap justify-space-between align-center gap-3 mb-4">
            <div>
              <h2 class="text-h6 font-weight-bold mb-0">
                Procesos en curso
              </h2>
              <p class="text-caption text-medium-emphasis mb-0">
                Una vista clara del recorrido de cada persona. Haz clic en una tarjeta para gestionar su seguimiento.
              </p>
            </div>

            <div class="d-flex flex-wrap align-center gap-2 tablero-controles">
              <AppTextField
                v-model="busquedaTablero"
                placeholder="Buscar candidato o vacante..."
                prepend-inner-icon="tabler-search"
                density="compact"
                clearable
                hide-details
                class="control-busqueda"
              />
              <AppSelect
                v-model="filtroVacanteId"
                :items="opcionesVacantesFiltro"
                density="compact"
                hide-details
                class="control-vacante"
              />
              <VChip
                v-if="soloAtencion"
                color="warning"
                size="small"
                closable
                @click:close="soloAtencion = false"
              >
                5+ días sin actualizar
              </VChip>
            </div>
          </div>

          <div class="tt-board-scroll tt-board-scroll--4">
            <div
              v-for="columna in columnasTablero"
              :key="columna.id"
              class="tt-stage-col"
            >
              <div class="tt-stage-head">
                <div class="tt-stage-title">
                  <i
                    class="tt-dot"
                    :style="{ backgroundColor: columna.color }"
                  />
                  <span>{{ columna.titulo }}</span>
                </div>
                <span class="tt-count-pill">{{ columna.items.length }}</span>
              </div>

              <template v-if="columna.items.length">
                <button
                  v-for="item in columna.items"
                  :key="item.id"
                  type="button"
                  class="tt-candidate-card"
                  :class="{ 'tt-candidate-card--warn': necesitaAtencionPostulacion(item) }"
                  @click="abrirSeguimiento(item)"
                >
                  <div class="d-flex align-center gap-2">
                    <div class="tt-avatar">
                      {{ inicialesPersona(item.candidato?.nombres, item.candidato?.apellidos) }}
                    </div>
                    <div class="min-w-0">
                      <div class="text-body-2 font-weight-bold text-truncate">
                        {{ nombreCompletoPersona(item.candidato) }}
                      </div>
                      <div class="text-caption text-medium-emphasis text-truncate">
                        {{ item.vacante?.puesto?.nombre || `Vacante #${item.vacante_id}` }}
                      </div>
                    </div>
                  </div>

                  <div class="d-flex flex-wrap align-center justify-space-between gap-1">
                    <span
                      class="tt-tag-days"
                      :class="{ 'tt-tag-days--warn': necesitaAtencionPostulacion(item) }"
                    >
                      {{ etiquetaDiasSinActualizar(diasSinActualizar(item)) }}
                    </span>
                    <span class="text-caption text-disabled text-truncate">
                      {{ obtenerEtapaNombre(item) }}
                    </span>
                  </div>
                </button>
              </template>

              <div
                v-else
                class="tt-empty-col"
              >
                Sin candidatos en esta etapa
              </div>
            </div>
          </div>
        </section>
      </VCol>

      <!-- Radar de seguimiento lateral -->
      <VCol
        cols="12"
        lg="4"
      >
        <aside class="tt-panel pa-5 h-100 d-flex flex-column">
          <div class="d-flex align-center gap-3 mb-4">
            <div class="tt-stat-icon tt-stat-icon--warn">
              <VIcon
                icon="tabler-clock-exclamation"
                size="20"
              />
            </div>
            <div>
              <h2 class="text-h6 font-weight-bold mb-0">
                Radar de seguimiento
              </h2>
              <p class="text-caption text-medium-emphasis mb-0">
                Para que nadie quede esperando
              </p>
            </div>
          </div>

          <div
            v-if="radarSeguimiento.length"
            class="flex-grow-1"
          >
            <div
              v-for="alerta in radarSeguimiento.slice(0, 5)"
              :key="alerta.id"
              class="tt-alert-card"
            >
              <div class="d-flex align-center justify-space-between gap-2">
                <strong class="text-body-2 font-weight-bold">
                  {{ nombreCompletoPersona(alerta.candidato) }}
                </strong>
                <VChip
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ diasSinActualizar(alerta) }} días
                </VChip>
              </div>
              <p class="text-caption text-medium-emphasis mb-2 mt-1">
                {{ alerta.vacante?.puesto?.nombre || `Vacante #${alerta.vacante_id}` }} · {{ obtenerEtapaNombre(alerta) }}
              </p>
              <button
                type="button"
                class="radar-link"
                @click="abrirSeguimiento(alerta)"
              >
                Revisar seguimiento →
              </button>
            </div>
          </div>

          <div
            v-else
            class="tt-detail-box d-flex flex-column align-center justify-center text-center py-8 flex-grow-1"
          >
            <div class="tt-stat-icon mb-2">
              <VIcon
                icon="tabler-checks"
                size="20"
              />
            </div>
            <strong class="mt-0">Seguimiento al día</strong>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              Ninguna postulación activa supera los {{ UMBRAL_DIAS_ATENCION }} días sin actualización.
            </p>
          </div>

          <div class="pt-3 mt-4 border-t text-caption text-medium-emphasis">
            Sugerencia: revisa el siguiente paso y comunica avances al candidato oportunamente.
          </div>
        </aside>
      </VCol>
    </VRow>

    <!-- Sección inferior: Actividad reciente + Vacantes activas -->
    <VRow class="mb-5">
      <VCol
        cols="12"
        md="6"
      >
        <section class="tt-panel pa-5 h-100">
          <div class="d-flex justify-space-between align-center mb-3">
            <div>
              <h2 class="text-h6 font-weight-bold mb-0">
                Actividad reciente
              </h2>
              <p class="text-caption text-medium-emphasis mb-0">
                Los últimos movimientos registrados por tu equipo
              </p>
            </div>
            <VBtn
              v-if="can('ver postulaciones', 'Postulacion')"
              variant="text"
              size="small"
              color="primary"
              to="/admin/postulaciones"
            >
              Ver todas
            </VBtn>
          </div>

          <div v-if="actividadReciente.length">
            <div
              v-for="item in actividadReciente"
              :key="item.id"
              class="actividad-row"
              @click="abrirDesdeActividad(item)"
            >
              <div class="actividad-icon">
                <VIcon
                  :icon="item.tipo === 'Registro' ? 'tabler-plus' : 'tabler-check'"
                  size="15"
                />
              </div>
              <div class="flex-grow-1 min-w-0">
                <div class="text-body-2 font-weight-medium">
                  {{ describirActividad(item) }}
                </div>
                <div class="text-caption text-medium-emphasis text-truncate">
                  {{ item.puesto || 'Proceso de selección' }}
                  <template v-if="item.actor">
                    · por {{ item.actor }}
                  </template>
                </div>
              </div>
              <span class="text-caption text-disabled flex-shrink-0">
                {{ tiempoRelativoCorto(item.created_at) }}
              </span>
            </div>
          </div>

          <div
            v-else
            class="tt-detail-box text-center py-6"
          >
            <p class="text-body-2 text-medium-emphasis mb-2">
              Aún no hay movimientos recientes registrados.
            </p>
            <VBtn
              v-if="can('crear postulaciones', 'Postulacion')"
              size="small"
              color="primary"
              variant="tonal"
              prepend-icon="tabler-plus"
              to="/admin/postulaciones/create"
            >
              Registrar primera postulación
            </VBtn>
          </div>
        </section>
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <section class="tt-panel pa-5 h-100">
          <div class="d-flex justify-space-between align-center mb-3">
            <div>
              <h2 class="text-h6 font-weight-bold mb-0">
                Vacantes activas
              </h2>
              <p class="text-caption text-medium-emphasis mb-0">
                Oportunidades abiertas hoy y volumen de candidatos
              </p>
            </div>
            <VBtn
              v-if="can('ver vacantes', 'Vacante')"
              variant="text"
              size="small"
              color="primary"
              to="/admin/vacantes"
            >
              Gestionar
            </VBtn>
          </div>

          <div v-if="vacantesActivas.length">
            <div
              v-for="vacante in vacantesActivas.slice(0, 5)"
              :key="vacante.id"
              class="vacante-row"
              @click="filtroVacanteId = filtroVacanteId === vacante.id ? null : vacante.id"
            >
              <div class="min-w-0">
                <div class="text-body-2 font-weight-bold text-truncate">
                  {{ vacante.puesto?.nombre || `Vacante #${vacante.id}` }}
                </div>
                <div class="text-caption text-medium-emphasis text-truncate">
                  {{ vacante.unidad?.nombre || 'Sin unidad' }} · {{ conteoPostulacionesPorVacante(vacante) }}
                  {{ conteoPostulacionesPorVacante(vacante) === 1 ? 'postulación' : 'postulaciones' }}
                </div>
              </div>

              <div class="d-flex align-center gap-2 flex-shrink-0">
                <VChip
                  size="x-small"
                  :color="vacante.estado === 'Abierta' ? 'success' : 'warning'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ vacante.estado === 'Abierta' ? 'Activa' : vacante.estado }}
                </VChip>
                <VBtn
                  icon="tabler-chevron-right"
                  size="x-small"
                  variant="text"
                  color="secondary"
                  :to="`/admin/vacantes/show/${vacante.id}`"
                  @click.stop
                />
              </div>
            </div>
          </div>

          <div
            v-else
            class="tt-detail-box text-center py-6"
          >
            <p class="text-body-2 text-medium-emphasis mb-2">
              No hay vacantes abiertas en este momento.
            </p>
            <VBtn
              v-if="can('crear vacantes', 'Vacante')"
              size="small"
              color="success"
              variant="tonal"
              prepend-icon="tabler-plus"
              to="/admin/vacantes/create"
            >
              Crear vacante
            </VBtn>
          </div>
        </section>
      </VCol>
    </VRow>

    <!-- Flujo institucional de punta a punta -->
    <section class="tt-panel pa-5">
      <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-3">
        <div>
          <span class="tt-eyebrow">FLUJO ORDENADO</span>
          <h3 class="text-subtitle-1 font-weight-bold mb-0">
            Un proceso de punta a punta
          </h3>
        </div>
        <span class="text-caption text-medium-emphasis">
          Cada etapa tiene responsable, evidencia y trazabilidad automática
        </span>
      </div>

      <div class="flujo-grid">
        <div
          v-for="item in pasosFlujo"
          :key="item.paso"
          class="flujo-item"
        >
          <div class="tt-stat-icon">
            <VIcon
              :icon="item.icon"
              size="17"
            />
          </div>
          <div>
            <span class="text-caption text-disabled d-block">Paso {{ item.paso }}</span>
            <strong class="text-body-2 font-weight-bold">{{ item.titulo }}</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal ejecutivo de seguimiento -->
    <DetalleSeguimientoDialog
      v-model="modalSeguimiento"
      :postulacion="postulacionActiva"
      :etapas="etapas"
      :seccion-inicial="seccionInicialSeguimiento"
      @actualizado="alActualizarPostulacion"
    />
  </div>
</template>

<style scoped>
@import '@styles/reclutamiento-talent.scss';

.tablero-controles .control-busqueda {
  min-width: 220px;
}

.tablero-controles .control-vacante {
  min-width: 215px;
}

.radar-link {
  background: none;
  border: 0;
  padding: 0;
  font-size: 12px;
  font-weight: 800;
  color: #1c775f;
  cursor: pointer;
}

.radar-link:hover {
  text-decoration: underline;
}

.v-theme--dark .radar-link {
  color: #6ee7b7;
}

.actividad-row,
.vacante-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 6px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.14s ease;
}

.actividad-row:last-child,
.vacante-row:last-child {
  border-bottom: 0;
}

.actividad-row:hover,
.vacante-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.actividad-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #edf7f2;
  color: #218268;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
}

.v-theme--dark .actividad-icon {
  background: rgba(33, 130, 104, 0.22);
  color: #6ee7b7;
}

.flujo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
  gap: 10px;
}

.flujo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.015);
}
</style>
