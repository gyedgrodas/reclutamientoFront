<script setup lang="ts">


const router = useRoute('perfil-usuario-tab')
const projectData = ref([])



const moreList = [
  { title: 'Rename Project', value: 'Rename Project' },
  { title: 'View Details', value: 'View Details' },
  { title: 'Add to favorites', value: 'Add to favorites' },
  { type: 'divider', class: 'my-2' },
  { title: 'Leave Project', value: 'Leave Project', class: 'text-error' },
]
</script>

<template>
  <VRow>
    <h1>FUNCIONES</h1>
  </VRow>
</template>
