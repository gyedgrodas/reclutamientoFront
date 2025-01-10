<template>
  <div>


    <VCard title="Want to integrate JWT? 🔒">


      <v-card-text->




      </v-card-text->




    </VCard>
  </div>
</template>


<script setup>

const { user } = useSanctumAuth();

import { useConfigStore } from '@core/stores/config'

const configStore = useConfigStore();

const cambiarPrefijo = () => {

  configStore.prefijoCookie = 'nuevoPrefijo_';

}

</script>
