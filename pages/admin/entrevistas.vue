<script setup lang="ts">
import CalendarioEntrevistas from '@/views/pages/reclutamiento/entrevistas/CalendarioEntrevistas.vue'

definePageMeta({
  navActiveLink: 'admin-entrevistas',
  middleware: ['permissions', 'dashboard-reclutamiento'],
  action: 'ver entrevistas',
  subject: 'Entrevista',
})
</script>

<template>
  <div>
    <CalendarioEntrevistas />
  </div>
</template>
