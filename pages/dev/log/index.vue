<script setup lang="ts">
import type DataTable from "@/components/form-elements/DataTableComponent.vue";
import type {SendSuccessInterface} from "@/types/sistema/types";
import {can} from "@layouts/plugins/casl";

const { descargar } = useArchivo();
// CAMBIAR NOMBRE DE PERMISO
definePageMeta({
  middleware: "permissions",
  action: "listar logs",
  subject: "dev",
});

const { paginaEspera } = useCargandoPagina();
const { get, post, deleted } = useClienteRequest();
const { showToastSuccess, showToastError, preguntaEliminar } = useToast();
const dataTable = ref<InstanceType<typeof DataTable> | null>(null)

const columnas = [
  {
    title: "Fecha",
    key: "fecha",
    sortable: false,
  },
  {
    title: "Todos",
    key: "all.count"
  },
  {
    title: "Errores", 
    key: "error.count"
  },
  { 
    title: "Advertencia", 
    key: "warning.count"
  },
  { 
    title: "Aviso", 
    key: "notice.count"
  },
  { 
    title: "Informacion",
    key: "info.count"
  },
  { 
    title: "Debug", 
    key: "debug.count",
  },
  { 
    title: "Acciones", 
    key: "Acciones",
    exportable: false,
    sortable: false,
  },
];

const descargarLog = async (fecha: string) => {
  paginaEspera.value = true;
  try {
    const res: any = await get<Blob>(
      `/api/configuracion/log-viewer/logs/${fecha}/download`,
      {
        responseType: "blob",
      },
    );

    descargar(res.data, undefined, res.headers["content-disposition"]);
  } catch (error: any) {
    mostrarError(error);
  } finally {
    paginaEspera.value = false;
  }
};

const deleteItem = async (fecha: number) => {
  const confirm = await preguntaEliminar("¿Desea Eliminar el Log?");

  if (!confirm) return;

  try {
    const respuesta = await deleted<SendSuccessInterface>(
      `api/configuracion/log-viewer/logs/delete?fecha=${fecha}`
    );

    showToastSuccess(respuesta.message);

    dataTable.value?.getItems();
  } catch (error) {
    showToastError(error.message);
  }
};


const isGenerarModalOpen = ref(false)
const tipoLog = ref<string | null>(null)

const tiposLog = [
  { title: 'Error', value: 'error' },
  { title: 'Advertencia', value: 'warning' },
  { title: 'Aviso', value: 'notice' },
  { title: 'Información', value: 'info' },
  { title: 'Debug', value: 'debug' },
]

const generarLogPrueba = async () => {
  if (!tipoLog.value) return

  paginaEspera.value = true
  try {
    const resp = await post<SendSuccessInterface>(
      '/api/configuracion/log-viewer/logs/generarPrueba',
      { tipo: tipoLog.value }
    )

    showToastSuccess(resp.message)
    isGenerarModalOpen.value = false
    tipoLog.value = null
    dataTable.value?.getItems()
  } catch (error: any) {
    showToastError(error.message)
  } finally {
    paginaEspera.value = false
  }
}

</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-4">
    <h1 v-text="'LOGS'"/>
    <VBtn
      color="secondary"
      @click="isGenerarModalOpen = true"
    >
      <VIcon icon="tabler-plus" class="mr-2" />
      Generar Prueba
    </VBtn>
  </div>

  <DataTableComponent
    ref="dataTable"
    :columnas="columnas"
    endpoint="/api/configuracion/log-viewer/menu"
    :cantidad-por-pagina="5"
    :cantidad-por-pagina-opciones="[2, 3, 5]"
    :botones="['reiniciar']"
  >
    <template #header.all.count="{ column }">
      <div class="d-flex align-center gap-1">
        <VIcon icon="tabler-list" size="18" />
        <span>{{ column.title }}</span>
      </div>
    </template>

    <!-- ERRORES -->
    <template #header.error.count="{ column }">
      <div class="d-flex align-center gap-1">
        <VIcon icon="tabler-alert-triangle" size="18" color="error" />
        <span>{{ column.title }}</span>
      </div>
    </template>

    <!-- ADVERTENCIA -->
    <template #header.warning.count="{ column }">
      <div class="d-flex align-center gap-1">
        <VIcon icon="tabler-alert-circle" size="18" color="warning" />
        <span>{{ column.title }}</span>
      </div>
    </template>

    <!-- AVISO -->
    <template #header.notice.count="{ column }">
      <div class="d-flex align-center gap-1">
        <VIcon icon="tabler-info-circle" size="18" color="info" />
        <span>{{ column.title }}</span>
      </div>
    </template>

    <!-- INFORMACION -->
    <template #header.info.count="{ column }">
      <div class="d-flex align-center gap-1">
        <VIcon icon="tabler-info-square" size="18" color="info" />
        <span>{{ column.title }}</span>
      </div>
    </template>

    <!-- DEBUG -->
    <template #header.debug.count="{ column }">
      <div class="d-flex align-center gap-1">
        <VIcon icon="tabler-bug" size="18" color="secondary" />
        <span>{{ column.title }}</span>
      </div>
    </template>
    <!-- ACCIONES -->
    <template #item.Acciones="{ item }">
      <VBtn
        v-if="can('listar logs', 'dev')"
        icon="tabler-eye"
        v-tooltip="'Ver'"
        variant="text"
        color="primary"
        :to="`/dev/log/show/${item.fecha}`"
      />
      <VBtn
        v-if="can('listar logs', 'dev')"
        icon="tabler-arrow-big-down-lines"
        v-tooltip="'Descargar'"
        variant="text"
        color="warning"
        @click="descargarLog(item.fecha)"
      />
      <VBtn
        v-if="can('borrar logs', 'dev')"
        icon="tabler-trash"
        v-tooltip="'Eliminar'"
        variant="text"
        color="error"
        @click="deleteItem(item.fecha)"
      />
    </template>
  </DataTableComponent>
  <VDialog v-model="isGenerarModalOpen" max-width="420">
    <VCard>
      <VCardTitle>
        Generar log de prueba
      </VCardTitle>

      <VCardText>
        <VSelect
          v-model="tipoLog"
          :items="tiposLog"
          label="Tipo de log"
          placeholder="Seleccione el tipo"
          clearable
        />
      </VCardText>

      <VCardActions class="justify-end">
        <VBtn
          variant="text"
          @click="isGenerarModalOpen = false"
        >
          Cancelar
        </VBtn>

        <VBtn
          color="primary"
          :disabled="!tipoLog"
          @click="generarLogPrueba"
        >
          Generar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

</template>
