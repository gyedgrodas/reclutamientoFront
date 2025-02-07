<script setup lang="ts">

</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- 👉 User Activity timeline -->
      <VCard title="Actividad de usuario">
        <VCardText>
          <VTimeline
            side="end"
            align="start"
            line-inset="8"
            truncate-line="start"
            density="compact"
          >
            <!-- SECTION Timeline Item: Flight -->
            <VTimelineItem dot-color="primary" size="small">
            </VTimelineItem>

            <VTimelineItem dot-color="success" size="small">
            </VTimelineItem>

            <VTimelineItem dot-color="info" size="small">
            </VTimelineItem>
            <!-- !SECTION -->
          </VTimeline>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
