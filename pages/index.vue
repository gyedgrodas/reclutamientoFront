<script setup lang="ts">
import DashboardReclutamiento from '@/views/pages/reclutamiento/dashboard/DashboardReclutamiento.vue'

const puedeVerDashboard = useDashboardReclutamiento()
const tabActiva = ref(puedeVerDashboard.value ? 'dashboard' : 'favoritos')

watch(puedeVerDashboard, puedeVer => {
  if (!puedeVer && tabActiva.value === 'dashboard')
    tabActiva.value = 'favoritos'
})
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <VTabs
        v-model="tabActiva"
        color="primary"
      >
        <VTab
          v-if="puedeVerDashboard"
          value="dashboard"
        >
          <VIcon
            icon="tabler-layout-dashboard"
            class="me-2"
          />
          Talento Humano
        </VTab>
        <VTab value="favoritos">
          <VIcon
            icon="tabler-star"
            class="me-2"
          />
          Accesos Favoritos
        </VTab>
      </VTabs>
    </div>

    <VWindow v-model="tabActiva">
      <VWindowItem
        v-if="puedeVerDashboard"
        value="dashboard"
      >
        <DashboardReclutamiento />
      </VWindowItem>
      <VWindowItem value="favoritos">
        <Favoritos />
      </VWindowItem>
    </VWindow>
  </div>
</template>
