<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 ">

    <p class="text-2xl">
      Inicio
    </p>

  </div>

  <VCard>
    <VCardText>
      <h3>Bienvenido, {{ user.nombre + ' ' + user.apellido }}</h3>
    </VCardText>
  </VCard>

</template>

<script setup>

const {user} = useSanctumAuth();

</script>
