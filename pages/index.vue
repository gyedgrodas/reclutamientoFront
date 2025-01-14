<template>
  <div>


    <VCard title="Want to integrate JWT? 🔒">


      <v-card-text->


        <v-btn color="primary" @click="activarEsperar">Activar esperar</v-btn>


      </v-card-text->


    </VCard>
  </div>
</template>


<script setup>

const {paginaEspera} = useCargandoPagina();

const activarEsperar = () => {
  paginaEspera.value = true;

  setTimeout(() => {
    paginaEspera.value = false;
  }, 3000);


};


</script>
