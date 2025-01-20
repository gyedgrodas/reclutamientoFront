<template>

  <div>

    <VCard>

      <VCardText style="height: 500px;">

        <!--        <H1>Bienvenido {{ user?.nombre }}</H1>-->


        <img alt="" src="../assets/guayacan_logo.svg" style="width: 100px; height: 100px">

        <img alt="" src="../assets/images/logo.svg" style="width: 50px; height: 50px">

      </VCardText>

    </VCard>

  </div>

</template>

<script setup>

const {user} = useSanctumAuth();

// import logo from '';
//
// console.log(logo)
//
</script>

