<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import DocumentosCandidato from '@/views/pages/reclutamiento/candidatos/DocumentosCandidato.vue'
import type { Candidato } from '@/types/reclutamiento'
import { colorPuntoEtapa, inicialesPersona, obtenerEtapaNombre } from '@/utils/reclutamientoUx'

definePageMeta({ navActiveLink: 'admin-candidatos', middleware: 'permissions', action: 'ver candidatos', subject: 'Candidato' })

const { get } = useClienteRequest()
const route = useRoute()
const registro = ref<Candidato | null>(null)
const cargando = ref(true)

const coloresEstado: Record<string, string> = {
  Activo: 'success',
  Inactivo: 'secondary',
  Descartado: 'error',
}

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Candidato }>(`/api/candidatos/${route.params.id}?include=municipio,media`)

    registro.value = respuesta.data
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
  <div>
    <header class="tt-page-header">
      <div class="d-flex align-center gap-3">
        <div
          v-if="registro"
          class="tt-avatar tt-avatar--lg"
        >
          {{ inicialesPersona(registro.nombres, registro.apellidos) }}
        </div>
        <div>
          <span class="tt-eyebrow">EXPEDIENTE DE TALENTO · #{{ route.params.id }}</span>
          <h1 class="tt-page-title">
            {{ registro ? `${registro.nombres} ${registro.apellidos}` : 'Expediente del candidato' }}
          </h1>
          <p class="tt-page-subtitle">
            {{ registro?.correo || 'Información personal, perfil profesional, procesos activos y documentación.' }}
          </p>
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <VBtn
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-arrow-left"
          to="/admin/candidatos"
        >
          Regresar
        </VBtn>
        <VBtn
          v-if="registro && can('crear postulaciones', 'Postulacion') && registro.estado === 'Activo'"
          color="success"
          prepend-icon="tabler-briefcase-2"
          :to="`/admin/postulaciones/create?candidato_id=${registro.id}`"
        >
          Postular a vacante
        </VBtn>
        <VBtn
          v-if="registro && can('editar candidatos', 'Candidato')"
          color="primary"
          variant="tonal"
          prepend-icon="tabler-edit"
          :to="`/admin/candidatos/edit/${registro.id}`"
        >
          Editar perfil
        </VBtn>
      </div>
    </header>

    <VProgressLinear
      v-if="cargando"
      indeterminate
      color="success"
      rounded
      class="mb-4"
    />

    <template v-else-if="registro">
      <VRow class="mb-5">
        <VCol
          cols="12"
          lg="8"
        >
          <section class="tt-panel pa-6 h-100">
            <div class="d-flex justify-space-between align-center flex-wrap gap-2 mb-4">
              <div>
                <span class="tt-eyebrow">FICHA PERSONAL Y PROFESIONAL</span>
                <h2 class="text-h6 font-weight-bold mb-0">
                  Información del candidato
                </h2>
              </div>
              <VChip
                :color="coloresEstado[registro.estado] || 'secondary'"
                variant="tonal"
                size="small"
                class="font-weight-bold"
              >
                {{ registro.estado }}
              </VChip>
            </div>

            <VRow dense>
              <VCol
                cols="12"
                sm="6"
              >
                <div class="tt-detail-box">
                  <span>Correo electrónico</span>
                  <strong>{{ registro.correo }}</strong>
                </div>
              </VCol>

              <VCol
                cols="12"
                sm="6"
              >
                <div class="tt-detail-box">
                  <span>Teléfono de contacto</span>
                  <strong>{{ registro.telefono || 'Sin registrar' }}</strong>
                </div>
              </VCol>

              <VCol
                cols="12"
                sm="6"
              >
                <div class="tt-detail-box">
                  <span>Documento DPI</span>
                  <strong>{{ registro.dpi || 'Sin registrar' }}</strong>
                </div>
              </VCol>

              <VCol
                cols="12"
                sm="6"
              >
                <div class="tt-detail-box">
                  <span>Fecha de nacimiento / Género</span>
                  <strong>
                    {{ registro.fecha_nacimiento ? formatearFecha(registro.fecha_nacimiento) : 'Sin fecha' }}
                    · {{ registro.genero || 'No especificado' }}
                  </strong>
                </div>
              </VCol>

              <VCol
                cols="12"
                sm="6"
              >
                <div class="tt-detail-box">
                  <span>Nivel académico</span>
                  <strong>{{ registro.nivel_academico || 'Sin registrar' }}</strong>
                </div>
              </VCol>

              <VCol
                cols="12"
                sm="6"
              >
                <div class="tt-detail-box">
                  <span>Pretensión salarial y fuente</span>
                  <strong>
                    {{ registro.pretension_salarial ? `Q ${Number(registro.pretension_salarial).toLocaleString('es-GT')}` : 'Por convenir' }}
                    · {{ registro.fuente_reclutamiento || 'Fuente no registrada' }}
                  </strong>
                </div>
              </VCol>

              <VCol cols="12">
                <div class="tt-detail-box">
                  <span>Ubicación y dirección</span>
                  <strong>{{ registro.municipio?.nombre || 'Municipio sin registrar' }} — {{ registro.direccion || 'Dirección no registrada' }}</strong>
                </div>
              </VCol>

              <VCol
                v-if="registro.observaciones"
                cols="12"
              >
                <div class="tt-detail-box">
                  <span>Observaciones del perfil</span>
                  <strong class="font-weight-regular">{{ registro.observaciones }}</strong>
                </div>
              </VCol>
            </VRow>
          </section>
        </VCol>

        <!-- Procesos en los que participa el candidato -->
        <VCol
          cols="12"
          lg="4"
        >
          <aside class="tt-panel pa-6 h-100">
            <span class="tt-eyebrow">PARTICIPACIÓN</span>
            <h2 class="text-h6 font-weight-bold mb-1">
              Procesos de selección
            </h2>
            <p class="text-caption text-medium-emphasis mb-4">
              Vacantes a las que se ha postulado esta persona.
            </p>

            <div
              v-if="registro.postulaciones?.length"
              class="d-flex flex-column gap-2"
            >
              <NuxtLink
                v-for="post in registro.postulaciones"
                :key="post.id"
                :to="`/admin/postulaciones?vacante_id=${post.vacante_id}`"
                class="tt-detail-box text-decoration-none d-block"
              >
                <div class="d-flex justify-space-between align-center gap-2">
                  <strong class="mt-0">{{ post.vacante?.puesto?.nombre || `Vacante #${post.vacante_id}` }}</strong>
                  <VChip
                    size="x-small"
                    :color="post.estado === 'Contratada' ? 'info' : post.estado === 'Descartada' ? 'error' : 'success'"
                    variant="tonal"
                  >
                    {{ post.estado }}
                  </VChip>
                </div>
                <div class="d-flex align-center gap-2 mt-2 text-caption text-medium-emphasis">
                  <i
                    class="tt-dot"
                    :style="{ backgroundColor: colorPuntoEtapa(obtenerEtapaNombre(post)) }"
                  />
                  <span>{{ obtenerEtapaNombre(post) }}</span>
                </div>
              </NuxtLink>
            </div>

            <div
              v-else
              class="tt-detail-box text-center py-6"
            >
              <p class="text-body-2 text-medium-emphasis mb-2">
                Aún no registra postulaciones activas.
              </p>
              <VBtn
                v-if="can('crear postulaciones', 'Postulacion') && registro.estado === 'Activo'"
                size="small"
                color="primary"
                variant="tonal"
                prepend-icon="tabler-plus"
                :to="`/admin/postulaciones/create?candidato_id=${registro.id}`"
              >
                Vincular a una vacante
              </VBtn>
            </div>
          </aside>
        </VCol>
      </VRow>

      <!-- Documentación del expediente -->
      <section class="tt-panel pa-6">
        <div class="mb-4">
          <span class="tt-eyebrow">SOPORTE DOCUMENTAL</span>
          <h2 class="text-h6 font-weight-bold mb-0">
            Documentos del expediente
          </h2>
        </div>

        <DocumentosCandidato
          v-if="can('gestionar documentos candidato', 'Candidato')"
          :candidato="registro"
          @actualizado="cargar"
        />
        <VAlert
          v-else
          type="info"
          variant="tonal"
        >
          No tiene permisos para gestionar los documentos de este candidato.
        </VAlert>
      </section>
    </template>

    <section
      v-else
      class="tt-panel pa-6 text-center"
    >
      No fue posible cargar el candidato.
      <VBtn
        variant="text"
        color="primary"
        @click="cargar"
      >
        Reintentar
      </VBtn>
    </section>
  </div>
</template>

<style scoped>
@import '@/assets/styles/reclutamiento-talent.scss';
</style>
