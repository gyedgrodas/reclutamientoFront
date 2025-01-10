<script setup lang="ts">

import fields from '@/views/pages/{{ modelPlurar }}/fields.vue'

// import { {{ model }} } from '@/pages/{{ modelPlurar }}/Interface.ts';

import {ref} from "vue";

const { put, get  } = useClienteRequest();

const { showToastSuccess, showToastError } = useToast();

const route = useRoute();

const id = route.params.id;

const {{ model }} = ref(fields);

const cargando = ref(false);

const actualizar{{ model }} = async ( {{ model }} ) => {

  try {

    const respuesta = await put('{{ url }}/' + id, {{ model }}.value );

    showToastSuccess(respuesta.message);

    navigateTo('/{{ directory }}');

  } catch (error) {

    showToastError(error.message);

  }

}

const item{{ model }} = ref({});

const get{{ model }} = async () => {

  try {

    cargando.value = true;

    const respuesta = await get('{{ url }}/' + id );

    item{{ model }}.value = respuesta.data;


  } catch (error) {

    showToastError(error.message);

  }

  cargando.value = false;

}

get{{ model }}();

</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="secondary"
      to="/{{ directory }}/"
    >
      Regresar
    </VBtn>
  </div>


<!--  <v-card>-->



<!--    <v-card-text>-->

      <AppCardActions
        v-model:loading="cargando"
        title="Editar {{ model }}"
        no-actions
      >

        <VCardText>

          <fields :fields="fields"
                  v-if="!cargando"
                  :item="item{{ model }}"
                  @emitirDatos="actualizar{{ model }}"
          />

        </VCardText>

      </AppCardActions>





<!--    </v-card-text>-->

<!--  </v-card>-->



</template>

<style scoped lang="scss">

</style>
