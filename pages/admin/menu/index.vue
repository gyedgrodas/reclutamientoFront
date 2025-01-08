<style scoped>
.tabular{
  margin-left: 10px;
}
</style>

<template>

  <v-card>

    <v-card-title>Configurar Menu</v-card-title>




    <v-card-text>

      <options-item :opciones="opcionesMenu" />

    </v-card-text>

  </v-card>

</template>

<script setup lang="ts">

import OptionsItem from './OptionsList.vue'

const opcionesMenu = useState('menu')

</script>
