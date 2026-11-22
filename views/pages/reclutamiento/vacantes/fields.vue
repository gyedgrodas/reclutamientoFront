<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { can } from '@layouts/plugins/casl'
import { requiredValidator } from '@core/utils/validators'
import type { DatosVacante, PuestoResumen, UnidadResumen, UsuarioResumen, Vacante } from '@/types/reclutamiento'
import type { SendResponseIndexInterface } from '@/types/sistema/types'

const props = defineProps<{ vacante?: Vacante; guardando: boolean }>()
const emit = defineEmits<{ (e: 'guardar', datos: DatosVacante): void }>()
const { getCatalogos } = useCatalogo()
const { get } = useClienteRequest()
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const esVinculadaASolicitud = computed(() => props.vacante?.solicitud_id != null)

const datos = reactive<DatosVacante>({
  puesto_id: props.vacante?.puesto_id ?? null,
  unidad_id: props.vacante?.unidad_id ?? null,
  solicitante_id: props.vacante?.solicitante_id ?? null,
  numero_plazas: props.vacante?.numero_plazas ?? null,
  motivo: props.vacante?.motivo || 'Nueva',
  descripcion: props.vacante?.descripcion ?? null,
  requisitos: props.vacante?.requisitos ?? null,
  fecha_apertura: props.vacante?.fecha_apertura || '',
  fecha_cierre_estimada: props.vacante?.fecha_cierre_estimada ?? null,
  fecha_cierre_real: props.vacante?.fecha_cierre_real ?? null,
  estado: props.vacante?.estado || 'Abierta',
})

const motivos = [{ title: 'Nueva', value: 'Nueva' }, { title: 'Reemplazo', value: 'Reemplazo' }]

const estados = [
  { title: 'Abierta', value: 'Abierta' },
  { title: 'En Proceso', value: 'En Proceso' },
  { title: 'Cubierta', value: 'Cubierta' },
  { title: 'Cancelada', value: 'Cancelada' },
]

const puestos = ref<PuestoResumen[]>([])
const unidades = ref<UnidadResumen[]>([])
const cargandoCatalogos = ref(false)
const catalogosListos = ref(false)

// El endpoint del catálogo puede responder el arreglo directo o el paginador de Laravel
const comoLista = (valor: any): any[] => Array.isArray(valor) ? valor : (valor?.data ?? [])

const cargarCatalogos = async () => {
  cargandoCatalogos.value = true
  try {
    const catalogos = await getCatalogos(['puestos', 'unidades'])

    puestos.value = comoLista(catalogos.puestos)
    unidades.value = comoLista(catalogos.unidades)
    catalogosListos.value = true
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargandoCatalogos.value = false
  }
}

// Búsqueda remota de solicitantes
const solicitantes = ref<UsuarioResumen[]>(props.vacante?.solicitante ? [props.vacante.solicitante] : [])
const buscandoSolicitantes = ref(false)

const solicitanteItems = computed(() => solicitantes.value.map(usuario => ({
  ...usuario,
  label: `${usuario.nombres} ${usuario.apellidos} (${usuario.usuario_dominio})`,
})))

const buscarSolicitantes = async (texto: string) => {
  if (esVinculadaASolicitud.value)
    return

  buscandoSolicitantes.value = true
  try {
    const respuesta = await get<SendResponseIndexInterface<UsuarioResumen[]>>('/api/users', {
      params: { 'page[number]': 1, 'page[size]': 15, 'filter[nombres]': texto },
    })

    solicitantes.value = respuesta.data.data
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    buscandoSolicitantes.value = false
  }
}

const buscarSolicitantesDebounced = useDebounceFn(buscarSolicitantes, 350)

const guardar = async () => {
  if (!(await form.value?.validate())?.valid || !catalogosListos.value)
    return

  emit('guardar', {
    ...datos,
    fecha_cierre_estimada: datos.fecha_cierre_estimada || null,
    fecha_cierre_real: datos.fecha_cierre_real || null,
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
      v-if="esVinculadaASolicitud"
      type="info"
      variant="tonal"
      class="mb-5"
    >
      <div class="d-flex flex-wrap align-center justify-space-between gap-2">
        <span>
          Esta vacante está vinculada a la solicitud #{{ props.vacante?.solicitud_id }}. El puesto, unidad, solicitante, número de plazas y motivo provienen de la aprobación y no pueden modificarse.
        </span>
        <VBtn
          v-if="can('ver solicitudes vacante', 'SolicitudVacante')"
          size="small"
          color="info"
          variant="outlined"
          prepend-icon="tabler-external-link"
          :to="`/admin/solicitudes-vacante/show/${props.vacante?.solicitud_id}`"
        >
          Ver solicitud #{{ props.vacante?.solicitud_id }}
        </VBtn>
      </div>
    </VAlert>

    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <AppAutocomplete
          v-model="datos.puesto_id"
          label="Puesto"
          :items="puestos"
          item-title="nombre"
          item-value="id"
          :loading="cargandoCatalogos"
          :disabled="esVinculadaASolicitud"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppAutocomplete
          v-model="datos.unidad_id"
          label="Unidad"
          :items="unidades"
          item-title="nombre"
          item-value="id"
          :loading="cargandoCatalogos"
          :disabled="esVinculadaASolicitud"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppAutocomplete
          v-model="datos.solicitante_id"
          label="Solicitante"
          :items="solicitanteItems"
          item-title="label"
          item-value="id"
          :clearable="!esVinculadaASolicitud"
          :disabled="esVinculadaASolicitud"
          no-filter
          :loading="buscandoSolicitantes"
          @update:search="buscarSolicitantesDebounced"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.numero_plazas"
          label="Número de plazas"
          type="number"
          min="1"
          :disabled="esVinculadaASolicitud"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppSelect
          v-model="datos.motivo"
          label="Motivo"
          :items="motivos"
          :disabled="esVinculadaASolicitud"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        v-if="props.vacante"
        cols="12"
        md="6"
      >
        <AppSelect
          v-model="datos.estado"
          label="Estado"
          :items="estados"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.fecha_apertura"
          label="Fecha de apertura"
          type="date"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.fecha_cierre_estimada"
          label="Fecha de cierre estimada"
          type="date"
        />
      </VCol>
      <VCol
        v-if="props.vacante"
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.fecha_cierre_real"
          label="Fecha de cierre real"
          type="date"
        />
      </VCol>
      <VCol cols="12">
        <AppTextarea
          v-model="datos.descripcion"
          label="Descripción"
        />
      </VCol>
      <VCol cols="12">
        <AppTextarea
          v-model="datos.requisitos"
          label="Requisitos"
        />
      </VCol>
      <VCol
        v-if="!catalogosListos && !cargandoCatalogos"
        cols="12"
      >
        <VAlert
          type="error"
          variant="tonal"
        >
          No fue posible cargar los puestos y unidades. <VBtn
            variant="text"
            @click="cargarCatalogos"
          >
            Reintentar
          </VBtn>
        </VAlert>
      </VCol>
      <VCol
        cols="12"
        class="d-flex gap-2"
      >
        <VBtn
          type="submit"
          :loading="guardando"
          :disabled="guardando || !catalogosListos"
        >
          Guardar
        </VBtn>
        <VBtn
          color="secondary"
          variant="tonal"
          to="/admin/vacantes"
        >
          Cancelar
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>
