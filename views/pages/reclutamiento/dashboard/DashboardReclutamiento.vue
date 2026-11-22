<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { Vacante } from '@/types/reclutamiento'

const { get } = useClienteRequest()

interface ResumenVacantes {
  total: number
  abiertas: number
  enProceso: number
  cubiertas: number
  totalPlazas: number
  recientes: Vacante[]
}

const cargando = ref(true)
const vacantes = ref<Vacante[]>([])

const resumen = computed<ResumenVacantes>(() => {
  const lista = vacantes.value
  const abiertas = lista.filter(v => v.estado === 'Abierta').length
  const enProceso = lista.filter(v => v.estado === 'En Proceso').length
  const cubiertas = lista.filter(v => v.estado === 'Cubierta').length
  const totalPlazas = lista.reduce((acc, v) => acc + (Number(v.numero_plazas) || 0), 0)

  return {
    total: lista.length,
    abiertas,
    enProceso,
    cubiertas,
    totalPlazas,
    recientes: lista.slice(0, 5),
  }
})

const coloresEstado: Record<string, string> = {
  'Abierta': 'success',
  'En Proceso': 'warning',
  'Cubierta': 'info',
  'Cancelada': 'secondary',
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

const cargarDatos = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Vacante[] }>('/api/vacantes?include=puesto,unidad,solicitante&sort=-id&perPage=50')

    vacantes.value = respuesta.data || []
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

onMounted(cargarDatos)
</script>

<template>
  <div class="reclutamiento-dashboard">
    <!-- Encabezado Hero / Banner inspirado en la maqueta -->
    <VCard
      class="mb-6 overflow-hidden hero-card text-white"
      elevation="2"
    >
      <VCardText class="pa-6">
        <div class="d-flex flex-wrap justify-space-between align-center gap-4">
          <div>
            <div class="d-flex align-center gap-2 mb-2">
              <VChip
                color="success"
                variant="elevated"
                size="small"
                class="font-weight-bold"
              >
                Talento Humano
              </VChip>
              <span class="text-caption text-white opacity-80">Cooperativa Guayacán</span>
            </div>
            <h1 class="text-h4 font-weight-bold mb-1 text-white">
              Centro de Talento y Reclutamiento
            </h1>
            <p class="text-body-1 mb-0 text-white opacity-90">
              Personas, procesos y próximos pasos: una vista integral para acompañar cada oportunidad de selección.
            </p>
          </div>
          <div class="d-flex gap-3">
            <VBtn
              v-if="can('crear vacantes', 'Vacante')"
              color="success"
              variant="elevated"
              prepend-icon="tabler-plus"
              to="/admin/vacantes/create"
            >
              Nueva vacante
            </VBtn>
            <VBtn
              v-if="can('ver vacantes', 'Vacante')"
              color="white"
              variant="outlined"
              prepend-icon="tabler-briefcase"
              to="/admin/vacantes"
            >
              Ver vacantes
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Métricas / KPIs -->
    <VRow class="mb-6">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard elevation="1">
          <VCardText class="d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis text-uppercase font-weight-medium">Vacantes Abiertas</span>
              <h2 class="text-h4 font-weight-bold mt-1 text-success">
                {{ resumen.abiertas }}
              </h2>
              <span class="text-caption text-disabled">Recepción activa</span>
            </div>
            <VAvatar
              color="success"
              variant="tonal"
              rounded
              size="48"
            >
              <VIcon
                icon="tabler-briefcase"
                size="28"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard elevation="1">
          <VCardText class="d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis text-uppercase font-weight-medium">En Selección</span>
              <h2 class="text-h4 font-weight-bold mt-1 text-warning">
                {{ resumen.enProceso }}
              </h2>
              <span class="text-caption text-disabled">Entrevistas / filtros</span>
            </div>
            <VAvatar
              color="warning"
              variant="tonal"
              rounded
              size="48"
            >
              <VIcon
                icon="tabler-users-group"
                size="28"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard elevation="1">
          <VCardText class="d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis text-uppercase font-weight-medium">Vacantes Cubiertas</span>
              <h2 class="text-h4 font-weight-bold mt-1 text-info">
                {{ resumen.cubiertas }}
              </h2>
              <span class="text-caption text-disabled">Candidato contratado</span>
            </div>
            <VAvatar
              color="info"
              variant="tonal"
              rounded
              size="48"
            >
              <VIcon
                icon="tabler-circle-check"
                size="28"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard elevation="1">
          <VCardText class="d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis text-uppercase font-weight-medium">Plazas Solicitadas</span>
              <h2 class="text-h4 font-weight-bold mt-1 text-primary">
                {{ resumen.totalPlazas }}
              </h2>
              <span class="text-caption text-disabled">Total acumulado</span>
            </div>
            <VAvatar
              color="primary"
              variant="tonal"
              rounded
              size="48"
            >
              <VIcon
                icon="tabler-id-badge-2"
                size="28"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow>
      <!-- Columna Principal: Flujo y Vacantes Recientes -->
      <VCol
        cols="12"
        lg="8"
      >
        <!-- Proceso de Punta a Punta -->
        <VCard
          class="mb-6"
          elevation="1"
        >
          <VCardItem>
            <template #title>
              <span class="font-weight-bold text-h6">Un proceso de punta a punta</span>
            </template>
            <template #subtitle>
              Desde la necesidad del área institucional hasta la decisión e incorporación final
            </template>
          </VCardItem>
          <VCardText>
            <div class="flujo-contenedor d-flex flex-wrap align-center gap-2 py-2">
              <template
                v-for="(paso, index) in pasosFlujo"
                :key="paso.paso"
              >
                <div class="flujo-paso pa-2 rounded-lg d-flex align-center gap-2 border">
                  <VAvatar
                    size="28"
                    color="primary"
                    variant="tonal"
                  >
                    <VIcon
                      :icon="paso.icon"
                      size="16"
                    />
                  </VAvatar>
                  <span class="text-caption font-weight-bold">{{ paso.titulo }}</span>
                </div>
                <VIcon
                  v-if="index < pasosFlujo.length - 1"
                  icon="tabler-chevron-right"
                  size="18"
                  class="text-medium-emphasis d-none d-sm-inline"
                />
              </template>
            </div>
            <p class="text-caption text-medium-emphasis mt-3 mb-0">
              * La gestión integral garantiza transparencia, trazabilidad de candidatos y cumplimiento del perfil por puesto.
            </p>
          </VCardText>
        </VCard>

        <!-- Vacantes en Gestión Recientes -->
        <VCard elevation="1">
          <VCardItem>
            <template #title>
              <span class="font-weight-bold text-h6">Vacantes en gestión</span>
            </template>
            <template #subtitle>
              Últimos procesos registrados en el sistema
            </template>
            <template #append>
              <VBtn
                variant="text"
                size="small"
                color="primary"
                to="/admin/vacantes"
                append-icon="tabler-arrow-right"
              >
                Ver todas
              </VBtn>
            </template>
          </VCardItem>
          <VDivider />
          <VCardText class="pa-0">
            <VProgressLinear
              v-if="cargando"
              indeterminate
            />
            <VList
              v-else-if="resumen.recientes.length"
              lines="two"
            >
              <VListItem
                v-for="v in resumen.recientes"
                :key="v.id"
                :to="`/admin/vacantes/show/${v.id}`"
                class="py-3"
              >
                <template #prepend>
                  <VAvatar
                    :color="coloresEstado[v.estado] || 'secondary'"
                    variant="tonal"
                    rounded
                    size="40"
                    class="me-3"
                  >
                    <VIcon
                      icon="tabler-briefcase"
                      size="22"
                    />
                  </VAvatar>
                </template>

                <VListItemTitle class="font-weight-bold">
                  {{ v.puesto?.nombre || `Vacante #${v.id}` }}
                </VListItemTitle>
                <VListItemSubtitle class="text-caption">
                  {{ v.unidad?.nombre || 'Sin unidad' }} · {{ v.numero_plazas }} {{ Number(v.numero_plazas) === 1 ? 'plaza' : 'plazas' }} · Motivo: {{ v.motivo }}
                </VListItemSubtitle>

                <template #append>
                  <div class="d-flex align-center gap-2">
                    <VChip
                      :color="coloresEstado[v.estado] || 'secondary'"
                      size="small"
                      class="font-weight-medium"
                    >
                      {{ v.estado }}
                    </VChip>
                    <VIcon
                      icon="tabler-chevron-right"
                      size="18"
                      class="text-medium-emphasis"
                    />
                  </div>
                </template>
              </VListItem>
            </VList>
            <div
              v-else
              class="text-center pa-6 text-medium-emphasis"
            >
              Aún no hay vacantes registradas en el sistema.
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Columna Lateral: Radar y Catálogos -->
      <VCol
        cols="12"
        lg="4"
      >
        <!-- Radar de Seguimiento -->
        <VCard
          class="mb-6"
          elevation="1"
        >
          <VCardItem>
            <template #prepend>
              <VAvatar
                color="warning"
                variant="tonal"
                size="34"
                class="me-2"
              >
                <VIcon
                  icon="tabler-clock"
                  size="20"
                />
              </VAvatar>
            </template>
            <template #title>
              <span class="font-weight-bold text-subtitle-1">Radar de seguimiento</span>
            </template>
            <template #subtitle>
              Alertas operativas de selección
            </template>
          </VCardItem>
          <VDivider />
          <VCardText class="pa-4">
            <VAlert
              type="info"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              <span class="text-caption font-weight-medium">Vacantes Abiertas pendientes de asignación:</span>
              <div class="text-body-2 font-weight-bold mt-1">
                {{ resumen.abiertas }} vacante(s) activas
              </div>
            </VAlert>

            <div class="bg-surface pa-3 rounded border text-caption text-medium-emphasis mb-3">
              <div class="d-flex align-center gap-2 mb-1">
                <VIcon
                  icon="tabler-calendar-time"
                  size="16"
                  color="warning"
                />
                <strong class="text-high-emphasis">Monitoreo de tiempos:</strong>
              </div>
              El radar identificará postulaciones que acumulen 5 días o más sin actualización en el pipeline de selección.
            </div>

            <VBtn
              block
              color="primary"
              variant="tonal"
              to="/admin/vacantes"
              prepend-icon="tabler-list-search"
            >
              Revisar procesos activos
            </VBtn>
          </VCardText>
        </VCard>

        <!-- Accesos a Catálogos de Soporte -->
        <VCard elevation="1">
          <VCardItem>
            <template #title>
              <span class="font-weight-bold text-subtitle-1">Estructura y Catálogos</span>
            </template>
            <template #subtitle>
              Configuración de soporte
            </template>
          </VCardItem>
          <VDivider />
          <VList density="compact">
            <VListItem
              to="/admin/catalogos/etapas-reclutamiento"
              prepend-icon="tabler-git-branch"
              title="Etapas de Reclutamiento"
              subtitle="Configurar pipeline"
            />
            <VListItem
              to="/admin/catalogos/departamentos"
              prepend-icon="tabler-map-2"
              title="Departamentos y Sedes"
              subtitle="Catálogo geográfico"
            />
            <VListItem
              to="/admin/catalogos/municipios"
              prepend-icon="tabler-building-community"
              title="Municipios de Guatemala"
              subtitle="Distribución territorial"
            />
          </VList>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped lang="scss">
.hero-card {
  background: linear-gradient(135deg, #113f36 0%, #175a4d 60%, #1e7565 100%);
  border-radius: 12px;
}

.flujo-paso {
  background: rgba(var(--v-theme-surface), 0.8);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}
</style>
