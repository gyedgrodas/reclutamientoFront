<script setup lang="ts">

import LogsDataTable from "@/views/pages/dev/log/LogsDataTable.vue";

definePageMeta({
  navActiveLink: "dev-log",
  middleware: "permissions",
  action: "listar logs",
  subject: "dev",
});

const { get } = useClienteRequest();
const route = useRoute();
const fecha = route.params.fecha;

const currentTab = ref("all");
const page = ref(1);
const itemsPerPage = ref(5);

const tiposLogs = ref([
  { id: "all", nombre: "Todos" },
  { id: "error", nombre: "Errores" },
  { id: "warning", nombre: "Advertencia" },
  { id: "notice", nombre: "Aviso" },
  { id: "info", nombre: "Información" },
  { id: "debug", nombre: "Debug" },
]);


const headers = [
  { title: "Entorno", key: "environment", sortable: false },
  { title: "Nivel", key: "level", sortable: false },
  { title: "Hora", key: "hora", sortable: true },
  { title: "Titulo", key: "titulo", sortable: false },
];

const Logs = ref({
  logs: [],
  stats: {},
  environment: "",
  pagination: {
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  },
});

const { paginaEspera } = useCargandoPagina();

const getLogs = async () => {
  paginaEspera.value = true
  try {
    const respuesta = await get(`api/configuracion/log-viewer/logs/${fecha}`, {
      params: {
        'page[number]': page.value,
        'page[size]': itemsPerPage.value,
        level: currentTab.value,
      },
    })

    Logs.value = respuesta.data
  } catch (error: any) {
    mostrarError(error)
  } finally {
    paginaEspera.value = false
  }
}

const logsFiltered = computed(() => {
  return (Logs.value?.logs || []).map((log: any) => ({
    ...log,
    canExpand: log.context,
  }));
});

const obtenerNivelColor = (level: string) => {
  const colors: Record<string, string> = {
    all: "primary",
    alert: "error",
    error: "error",
    warning: "warning",
    notice: "info",
    info: "info",
    debug: "secondary",
  };
  return colors[level?.toLowerCase()] || "grey";
};

const obtenerIconoNivel = (level: string) => {
  const icons: Record<string, string> = {
    all: "tabler-list",
    alert: "tabler-alert-circle",
    error: "tabler-alert-triangle",
    warning: "tabler-alert-circle",
    notice: "tabler-info-circle",
    info: "tabler-info-circle",
    debug: "tabler-bug",
  };
  return icons[level?.toLowerCase()] || "tabler-file";
};

watch([currentTab, page, itemsPerPage], async () => {
  await getLogs()
})

watch(currentTab, () => {
  page.value = 1;
});

const obtenerConteoLog = (log) => {
  const count = Logs.value?.stats ? Logs.value?.stats[log.id] : 0;
  return count > 0 ? count : null; 
};

getLogs();
</script>

<template>
  <VCard class="mb-6" elevation="2">
    <VCardText class="d-flex flex-wrap justify-space-between align-center gap-3 pa-4">
      <div class="d-flex align-center gap-3">
        <VAvatar color="primary" size="48">
          <VIcon icon="tabler-calendar-event" size="28" />
        </VAvatar>

        <div>
          <h6 class="text-h6 font-weight-semibold">
            Fecha de registro:
            {{ formatearFecha(fecha) }}
          </h6>
          <div class="d-flex align-center gap-2 mt-1">
            <VIcon icon="tabler-server" size="24" color="grey" />
            <span class="text-grey">
              {{ Logs.environment || "Cargando..." }}
            </span>
          </div>
        </div>
      </div>

      <VBtn color="primary" prepend-icon="tabler-arrow-left" to="/dev/log">
        Regresar
      </VBtn>
    </VCardText>
  </VCard>

  <VCard>
    <VTabs v-model="currentTab" class="mb-4" bg-color="transparent">
      <template v-for="log in tiposLogs" :key="log.id">
        <VTab :value="log.id" class="px-4">
          <div class="d-flex align-center gap-2">
            <VIcon
              :icon="obtenerIconoNivel(log.id)"
              size="20"
              :color="obtenerNivelColor(log.id)"
            />

            <span>{{ log.nombre }}</span>
            <VBadge
              v-if="obtenerConteoLog(log)"
              :content="obtenerConteoLog(log)"
              color="white"
              text-color="black"
              inline
            />
          </div>
        </VTab>
      </template>
    </VTabs>
    <VWindow v-model="currentTab">
      <template v-for="log in tiposLogs" :key="log.id">
        <VWindowItem :value="log.id">
          <LogsDataTable
            :headers="headers"
            :logs="logsFiltered"
            :environment="Logs.environment"
            :pagination="Logs.pagination"
            :page="page"
            :itemsPerPage="itemsPerPage"
            @update:page="page = $event"
            @update:itemsPerPage="itemsPerPage = $event"
          />
        </VWindowItem>
      </template>
    </VWindow>
  </VCard>
</template>
