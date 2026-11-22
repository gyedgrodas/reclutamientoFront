<script setup lang="ts">
import { requiredValidator } from '@core/utils/validators'
import type { Candidato, DatosPostulacion, EtapaReclutamiento, Postulacion, UsuarioResumen, Vacante } from '@/types/reclutamiento'
import EvaluacionCorreoFields from '@/views/pages/reclutamiento/postulaciones/EvaluacionCorreoFields.vue'

const props = defineProps<{ postulacion?: Postulacion; guardando: boolean }>()
const emit = defineEmits<{ (e: 'guardar', datos: DatosPostulacion): void }>()
const route = useRoute()
const { get } = useClienteRequest()

const form = ref<any>(null)
const candidatos = ref<Candidato[]>([])
const vacantes = ref<Vacante[]>([])
const etapas = ref<EtapaReclutamiento[]>([])
const responsables = ref<UsuarioResumen[]>([])
const procesoContratado = computed(() => props.postulacion?.estado === 'Contratada' || !!props.postulacion?.contratada_at)

const estadosDisponibles = computed(() => procesoContratado.value
  ? ['Contratada']
  : ['En proceso', 'Descartada', 'Retirada'])

const etapaOriginal = props.postulacion?.etapa_reclutamiento_id
  ?? props.postulacion?.etapaReclutamiento?.id
  ?? props.postulacion?.etapa_reclutamiento?.id
  ?? null

const candidatoInicial = props.postulacion?.candidato_id
  ?? (route.query.candidato_id ? Number(route.query.candidato_id) : null)

const vacanteInicial = props.postulacion?.vacante_id
  ?? (route.query.vacante_id ? Number(route.query.vacante_id) : null)

const datos = reactive<DatosPostulacion>({
  candidato_id: candidatoInicial,
  vacante_id: vacanteInicial,
  etapa_reclutamiento_id: etapaOriginal,
  responsable_id: props.postulacion?.responsable_id ?? null,
  fecha_postulacion: props.postulacion?.fecha_postulacion?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  fecha_ultima_actualizacion: props.postulacion?.fecha_ultima_actualizacion ?? null,
  estado: props.postulacion?.estado || 'En proceso',
  observaciones: props.postulacion?.observaciones ?? null,
  evaluacion_url: props.postulacion?.evaluacion_url ?? null,
  evaluacion_limite_at: props.postulacion?.evaluacion_limite_at ?? null,
})

const esEvaluacion = computed(() => etapas.value
  .find(etapa => etapa.id === datos.etapa_reclutamiento_id)?.nombre.toLowerCase().includes('psicom'))

const normalizarId = (id: number | null | undefined) => id == null ? null : String(id)

const hayMovimiento = computed(() => !!props.postulacion && (
  normalizarId(datos.etapa_reclutamiento_id) !== normalizarId(etapaOriginal)
  || datos.estado !== props.postulacion.estado
  || normalizarId(datos.responsable_id) !== normalizarId(props.postulacion.responsable_id)
))

const observacionMovimiento = ref<string | null>('')
const contarCaracteres = (valor: string | null) => Array.from(valor ?? '').length

const validarObservacionMovimiento = (valor: string | null) =>
  contarCaracteres(valor) <= 2000 || 'Máximo 2000 caracteres'

watch(hayMovimiento, aplica => {
  if (!aplica)
    observacionMovimiento.value = ''
})

function lista<T>(response: any): T[] {
  return Array.isArray(response?.data) ? response.data : (response?.data?.data || [])
}

const cargar = async () => {
  try {
    const [c, v, e, r] = await Promise.all([
      get<any>('/api/candidatos?page[size]=100'),
      get<any>('/api/vacantes?include=puesto,unidad&page[size]=100'),
      get<any>('/api/catalogo/etapas-reclutamiento?limit=100'),
      get<any>('/api/users?page[size]=100'),
    ])

    candidatos.value = lista<Candidato>(c)
    vacantes.value = lista<Vacante>(v)
    etapas.value = lista<EtapaReclutamiento>(e)
      .filter(etapa => etapa.estado !== 'Inactivo' && (procesoContratado.value || etapa.nombre.toLowerCase() !== 'contratado'))
      .sort((a, b) => (a.orden ?? a.id) - (b.orden ?? b.id))
    responsables.value = lista<UsuarioResumen>(r)

    if (!props.postulacion && !datos.etapa_reclutamiento_id && etapas.value.length)
      datos.etapa_reclutamiento_id = etapas.value[0].id
  }
  catch (error) {
    manejaError(error)
  }
}

const guardar = async () => {
  if (!(await form.value?.validate())?.valid)
    return

  const observacion = observacionMovimiento.value?.trim()

  emit('guardar', {
    ...datos,
    ...(hayMovimiento.value && observacion ? { observacion_movimiento: observacion } : {}),
  })
}

onMounted(cargar)
</script>

<template>
  <VForm
    ref="form"
    @submit.prevent="guardar"
  >
    <VAlert type="info" variant="tonal" class="mb-4">
      La contratación se confirma desde Seguimiento → Contratación, con oferta aceptada y control de plazas.
      <span v-if="procesoContratado">Esta postulación está finalizada; solo puede actualizar sus notas y responsable.</span>
    </VAlert>
    <VRow>
      <VCol cols="12">
        <span class="tt-eyebrow">VINCULACIÓN</span>
        <h3 class="text-subtitle-1 font-weight-bold mb-1">
          Candidato y oportunidad laboral
        </h3>
        <p class="text-caption text-medium-emphasis mb-2">
          Seleccione la persona postulante y la vacante institucional a la cual aplica.
        </p>
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <AppAutocomplete
          v-model="datos.candidato_id"
          label="Candidato *"
          placeholder="Buscar por nombre o correo..."
          :items="candidatos"
          :item-title="(c: Candidato) => `${c.nombres} ${c.apellidos}`"
          item-value="id"
          :rules="[requiredValidator]"
          :disabled="!!props.postulacion"
          clearable
        >
          <template #item="{ props: itemProps, item }">
            <VListItem
              v-bind="itemProps"
              :title="`${item.raw.nombres} ${item.raw.apellidos}`"
              :subtitle="item.raw.correo"
            />
          </template>
        </AppAutocomplete>
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <AppAutocomplete
          v-model="datos.vacante_id"
          label="Vacante *"
          placeholder="Seleccionar puesto y unidad..."
          :items="vacantes"
          :item-title="(v: Vacante) => `#${v.id} · ${v.puesto?.nombre || 'Vacante'}`"
          item-value="id"
          :rules="[requiredValidator]"
          :disabled="!!props.postulacion"
          clearable
        >
          <template #item="{ props: itemProps, item }">
            <VListItem
              v-bind="itemProps"
              :title="`#${item.raw.id} · ${item.raw.puesto?.nombre || 'Vacante'}`"
              :subtitle="`${item.raw.unidad?.nombre || 'Sin unidad'} · ${item.raw.estado}`"
            />
          </template>
        </AppAutocomplete>
      </VCol>

      <VCol
        cols="12"
        class="mt-2"
      >
        <VDivider class="mb-4" />
        <span class="tt-eyebrow">SEGUIMIENTO DEL PROCESO</span>
        <h3 class="text-subtitle-1 font-weight-bold mb-1">
          Etapa actual, estado y responsable
        </h3>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <AppAutocomplete
          v-model="datos.etapa_reclutamiento_id"
          label="Etapa de selección *"
          :items="etapas"
          item-title="nombre"
          item-value="id"
          :rules="[requiredValidator]"
          :disabled="procesoContratado"
          clearable
        />
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <AppAutocomplete
          v-model="datos.responsable_id"
          label="Responsable de seguimiento"
          placeholder="Asignar reclutador o líder..."
          :items="responsables"
          :item-title="(u: UsuarioResumen) => `${u.nombres} ${u.apellidos} (${u.usuario_dominio})`"
          item-value="id"
          clearable
        />
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <AppSelect
          v-model="datos.estado"
          label="Estado de la postulación *"
          :items="estadosDisponibles"
          :disabled="procesoContratado"
          :rules="[requiredValidator]"
        />
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <AppTextField
          v-model="datos.fecha_postulacion"
          label="Fecha de postulación *"
          type="date"
          :rules="[requiredValidator]"
        />
      </VCol>

      <VCol cols="12">
        <EvaluacionCorreoFields
          v-if="esEvaluacion"
          v-model:url="datos.evaluacion_url"
          v-model:limite="datos.evaluacion_limite_at"
          :disabled="guardando"
          class="mb-4"
        />
        <AppTextarea
          v-model="datos.observaciones"
          label="Observaciones generales del expediente"
          placeholder="Resumen ejecutivo del candidato frente al perfil del puesto..."
          rows="3"
        />
      </VCol>

      <VCol
        v-if="hayMovimiento"
        cols="12"
      >
        <div class="tt-alert-card">
          <div class="d-flex align-center gap-2 mb-2">
            <VIcon
              icon="tabler-history"
              color="warning"
              size="18"
            />
            <strong class="text-body-2">Se detectó un cambio de etapa, estado o responsable</strong>
          </div>
          <AppTextarea
            v-model="observacionMovimiento"
            label="Nota para el historial del movimiento (opcional)"
            placeholder="Ej. Pasa a entrevista técnica con gerencia de área tras aprobar evaluación."
            hint="Esta nota quedará registrada de forma permanente en la línea de tiempo de seguimiento."
            persistent-hint
            rows="2"
            :counter="2000"
            :counter-value="contarCaracteres"
            :rules="[validarObservacionMovimiento]"
          />
        </div>
      </VCol>

      <VCol
        cols="12"
        class="d-flex justify-end gap-3 mt-2"
      >
        <VBtn
          to="/admin/postulaciones"
          color="secondary"
          variant="tonal"
        >
          Cancelar
        </VBtn>
        <VBtn
          type="submit"
          color="primary"
          prepend-icon="tabler-device-floppy"
          :loading="guardando"
        >
          {{ props.postulacion ? 'Guardar cambios' : 'Registrar postulación' }}
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>

<style scoped>
@import '@styles/reclutamiento-talent.scss';
</style>
