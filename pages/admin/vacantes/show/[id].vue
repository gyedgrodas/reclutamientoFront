<script setup lang="ts">
import type { Vacante } from '@/types/reclutamiento'

definePageMeta({ navActiveLink: 'admin-vacantes', middleware: 'permissions', action: 'ver vacantes', subject: 'Vacante' })

const { get } = useClienteRequest()
const route = useRoute()
const registro = ref<Vacante | null>(null)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Vacante }>(`/api/vacantes/${route.params.id}?include=puesto,unidad,solicitante`)

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
  <VCard title="Detalle de la vacante">
    <VCardText>
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />
      <VRow v-else-if="registro">
        <VCol
          cols="12"
          md="6"
        >
          <strong>Puesto:</strong> {{ registro.puesto?.nombre ?? registro.puesto_id }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Unidad:</strong> {{ registro.unidad?.nombre ?? registro.unidad_id }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Solicitante:</strong> {{ registro.solicitante ? `${registro.solicitante.nombres} ${registro.solicitante.apellidos}` : 'Sin asignar' }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Número de plazas:</strong> {{ registro.numero_plazas }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Motivo:</strong> {{ registro.motivo }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Estado:</strong> {{ registro.estado }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Fecha de apertura:</strong> {{ formatearFecha(registro.fecha_apertura) }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Fecha de cierre estimada:</strong> {{ registro.fecha_cierre_estimada ? formatearFecha(registro.fecha_cierre_estimada) : 'Sin definir' }}
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <strong>Fecha de cierre real:</strong> {{ registro.fecha_cierre_real ? formatearFecha(registro.fecha_cierre_real) : 'Sin definir' }}
        </VCol>
        <VCol cols="12">
          <strong>Descripción:</strong> {{ registro.descripcion ?? 'Sin descripción' }}
        </VCol>
        <VCol cols="12">
          <strong>Requisitos:</strong> {{ registro.requisitos ?? 'Sin requisitos' }}
        </VCol>
      </VRow>
      <div v-else>
        No fue posible cargar la vacante. <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>
      <VBtn
        class="mt-4"
        color="secondary"
        variant="tonal"
        to="/admin/vacantes"
      >
        Regresar
      </VBtn>
    </VCardText>
  </VCard>
</template>
