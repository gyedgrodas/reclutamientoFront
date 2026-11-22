<script setup lang="ts">
import { integerValidator, requiredValidator } from '@core/utils/validators'
import type {
  DatosSolicitudVacante,
  PuestoResumen,
  UnidadResumen,
} from '@/types/reclutamiento'
import type { UsuarioInterface } from '@/types/usuarios'
import { nombreCompletoPersona } from '@/utils/reclutamientoUx'

const props = defineProps<{
  guardando: boolean
}>()

const emit = defineEmits<{
  (e: 'guardar', datos: DatosSolicitudVacante): void
}>()

const { getCatalogos } = useCatalogo()
const usuarioAutenticado = useSanctumUser<UsuarioInterface>()
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const datos = reactive<DatosSolicitudVacante>({
  puesto_id: null,
  unidad_id: null,
  numero_plazas: 1,
  motivo: 'Nueva',
  justificacion: '',
})

const motivos = [
  { title: 'Nueva', value: 'Nueva' },
  { title: 'Reemplazo', value: 'Reemplazo' },
]

const puestos = ref<PuestoResumen[]>([])
const unidades = ref<UnidadResumen[]>([])
const cargandoCatalogos = ref(false)
const catalogosListos = ref(false)
const errorCatalogos = ref<string | null>(null)

function comoLista<T>(valor: any, nombreCatalogo: string): T[] {
  if (Array.isArray(valor))
    return valor
  if (Array.isArray(valor?.data))
    return valor.data

  throw new Error(`Formato inesperado al cargar el catálogo de ${nombreCatalogo}.`)
}

const cargarCatalogos = async () => {
  cargandoCatalogos.value = true
  errorCatalogos.value = null
  try {
    const catalogos = await getCatalogos(['puestos', 'unidades'])

    puestos.value = comoLista<PuestoResumen>(catalogos.puestos, 'puestos')
    unidades.value = comoLista<UnidadResumen>(catalogos.unidades, 'unidades')
    catalogosListos.value = true
  }
  catch (error: any) {
    catalogosListos.value = false
    errorCatalogos.value = error?.response?.data?.message || error?.message || 'No fue posible cargar los catálogos de puestos y unidades.'
    manejaError(error)
  }
  finally {
    cargandoCatalogos.value = false
  }
}

const validarPlazas = (value: unknown) => {
  const num = Number(value)
  if (!Number.isInteger(num) || num < 1 || num > 32767)
    return 'Ingrese un número entero entre 1 y 32,767'

  return true
}

const validarJustificacion = (value: unknown) => {
  const texto = String(value ?? '').trim()
  if (!texto.length)
    return 'La justificación del requerimiento es obligatoria'
  if (texto.length > 10000)
    return 'La justificación no debe superar los 10,000 caracteres'

  return true
}

const nombreSolicitante = computed(() => {
  if (!usuarioAutenticado.value)
    return 'Usuario autenticado'

  return nombreCompletoPersona(usuarioAutenticado.value)
})

const guardar = async () => {
  if (props.guardando || !catalogosListos.value)
    return

  const resultado = await form.value?.validate()
  if (!resultado?.valid)
    return

  emit('guardar', {
    puesto_id: Number(datos.puesto_id),
    unidad_id: Number(datos.unidad_id),
    numero_plazas: Number(datos.numero_plazas),
    motivo: datos.motivo,
    justificacion: datos.justificacion.trim(),
  })
}

onMounted(cargarCatalogos)
</script>

<template>
  <VForm
    ref="form"
    @submit.prevent="guardar"
  >
    <VAlert
      v-if="errorCatalogos"
      type="error"
      variant="tonal"
      class="mb-5"
    >
      <div class="d-flex flex-wrap align-center justify-space-between gap-2">
        <span>{{ errorCatalogos }}</span>
        <VBtn
          size="small"
          variant="outlined"
          color="error"
          prepend-icon="tabler-refresh"
          :loading="cargandoCatalogos"
          @click="cargarCatalogos"
        >
          Reintentar
        </VBtn>
      </div>
    </VAlert>

    <div class="tt-detail-box mb-5">
      <div class="d-flex flex-wrap align-center justify-space-between gap-2">
        <div>
          <span>Solicitante registrado automáticamente</span>
          <strong>{{ nombreSolicitante }}</strong>
        </div>
        <VChip
          color="warning"
          variant="tonal"
          size="small"
          prepend-icon="tabler-clock"
          class="font-weight-bold"
        >
          Estado inicial: Pendiente
        </VChip>
      </div>
    </div>

    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <AppAutocomplete
          v-model="datos.puesto_id"
          label="Puesto requerido *"
          placeholder="Seleccione el puesto"
          :items="puestos"
          item-title="nombre"
          item-value="id"
          :loading="cargandoCatalogos"
          :disabled="!catalogosListos || guardando"
          :rules="[requiredValidator]"
          clearable
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <AppAutocomplete
          v-model="datos.unidad_id"
          label="Unidad / Agencia *"
          placeholder="Seleccione departamento o agencia"
          :items="unidades"
          item-title="nombre"
          item-value="id"
          :loading="cargandoCatalogos"
          :disabled="!catalogosListos || guardando"
          :rules="[requiredValidator]"
          clearable
        />
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="4"
      >
        <AppTextField
          v-model.number="datos.numero_plazas"
          label="Número de plazas *"
          type="number"
          min="1"
          max="32767"
          :disabled="guardando"
          :rules="[requiredValidator, integerValidator, validarPlazas]"
        />
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="4"
      >
        <AppSelect
          v-model="datos.motivo"
          label="Motivo del requerimiento *"
          :items="motivos"
          :disabled="guardando"
          :rules="[requiredValidator]"
        />
      </VCol>

      <VCol cols="12">
        <AppTextarea
          v-model="datos.justificacion"
          label="Justificación del requerimiento *"
          placeholder="Describa la necesidad operativa, crecimiento de cartera, apertura o reemplazo que respalda la solicitud..."
          rows="4"
          counter="10000"
          :disabled="guardando"
          :rules="[requiredValidator, validarJustificacion]"
        />
      </VCol>

      <VCol
        cols="12"
        class="d-flex flex-wrap gap-3 pt-2"
      >
        <VBtn
          type="submit"
          color="primary"
          prepend-icon="tabler-send"
          :loading="guardando"
          :disabled="guardando || !catalogosListos"
        >
          Enviar solicitud a aprobación
        </VBtn>
        <VBtn
          color="secondary"
          variant="tonal"
          to="/admin/solicitudes-vacante"
          :disabled="guardando"
        >
          Cancelar
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>

<style scoped>
@import "@styles/reclutamiento-talent.scss";
</style>
