<template>

  <div>

    <VCard>

      <VCardText>

        <H1>Bienvenido {{ user?.nombre }}</H1>

      </VCardText>

    </VCard>

  </div>

</template>

<script setup>

const {user} = useSanctumAuth();

</script>

