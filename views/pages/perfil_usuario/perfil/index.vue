<script setup lang="ts">
import About from './About.vue'
import ActivityTimeline from './bitacora.vue'

const props = defineProps({
  user: {
    type: Object,
    required: true,
    default: () => ({}),
  },
})
</script>

<template>
  <VRow v-if="user">
    <VCol
      md="4"
      cols="12"
    >
      <About :data="user" />
    </VCol>

    <VCol
      cols="12"
      md="8"
    >
      <VRow>
        <VCol cols="12">
          <ActivityTimeline />
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
