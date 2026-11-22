<script setup lang="ts">
import DashboardReclutamiento from '@/views/pages/reclutamiento/dashboard/DashboardReclutamiento.vue'

definePageMeta({
  navActiveLink: 'admin-dashboard',
  middleware: 'permissions',
  action: 'ver vacantes',
  subject: 'Vacante',
})
</script>

<template>
  <div>
    <DashboardReclutamiento />
  </div>
</template>
