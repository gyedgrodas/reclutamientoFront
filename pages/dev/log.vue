<script setup lang="ts">
const { get } = useClienteRequest()
const { showToastError } = useToast()

const vista = ref()

const loadLogs = async () => {
  try {
    vista.value = await get('/api/log-viewer/logs')
  }
  catch (error) {
    showToastError('Error al cargar los logs')
  }
}

loadLogs()
</script>

<template>
  <VCard>
    <div>
      <iframe
        class="frame"
        :srcdoc="vista"
      />
    </div>
  </VCard>
</template>

<style scoped>
.frame {
  width: 100%;
  height: 100vh;
  border: none;
  color: #25293C;
}
</style>
