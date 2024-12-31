<template>

  <v-card>
    <v-card-title>Prueba Notificaciones</v-card-title>
    <v-card-text>
      <v-btn border="border"
             @click="mostrarToastSuccess">
        Mostrar Toast Success
      </v-btn>

      <v-btn color="error"
             @click="mostrarToastError">
        Mostrar Toast Error
      </v-btn>


      <v-btn @click="mostrarToastWarning"
             color="warning"
      >
        Mostrar Toast Warning
      </v-btn>

      <v-btn @click="mostrarToastInfo"
             color="info"
      >
        Mostrar Toast Info
      </v-btn>
    </v-card-text>
  </v-card>


</template>


<script setup lang="ts">

const {showToastInfo, showToastSuccess, showToastWarning, showToastError} = useToast();


const mostrarToastInfo = () => {

  showToastInfo('Hello from second page');

}

const mostrarToastSuccess = () => {

  showToastSuccess('Hello from second page');

}

const mostrarToastWarning = () => {

  showToastWarning('Hello from second page');

}

const mostrarToastError = () => {

  showToastError('Hello from second page');

}


</script>
