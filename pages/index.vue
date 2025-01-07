<template>
  <div>


    <VCard title="Want to integrate JWT? 🔒">


      <v-card-text>
        <h1 v-text="user?.id"></h1>

        <VBtn
          @click="getOpcionesMenu"
        >
          GetMenuOpciones
        </VBtn>

      </v-card-text>




    </VCard>
  </div>
</template>


<script setup>

const { user } = useSanctumAuth();

import { useConfigStore } from '@core/stores/config'

const configStore = useConfigStore();

const { Get } = useJsonApiClient();

const getOpcionesMenu = async () => {

  try {

    const res = await Get("api/menu_opciones");

    console.log(res)

  } catch (error) {

    console.error(error);

  }
}

</script>
