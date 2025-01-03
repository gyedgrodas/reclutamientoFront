<template>
  <div>


    <VCard title="Want to integrate JWT? 🔒">


      <v-card-text>
        <h1 v-text="user?.id"></h1>

        <VBtn
          @click="cambiarPrefijo"
        >
          Cambiar prefijo
        </VBtn>

      </v-card-text>




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
