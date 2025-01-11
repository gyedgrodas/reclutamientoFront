<script setup lang="ts">


definePageMeta({
  middleware: 'permissions',
  action: 'ver {{ modelPlural }}', // Acción requerida
  subject: '{{ modelPlural }}',  // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
});

import type { {{ model }}Interface } from '@/types/{{ modelPlural }}/index.ts';

import {ref} from "vue";

const { get } = useClienteRequest();

const { showToastSuccess, showToastError } = useToast();

const route = useRoute();

const id = route.params.id;

const cargando = ref(false);

const item = ref({});

const get{{ model }} = async () => {

  try {

    cargando.value = true;

    const respuesta = await get('{{ url }}/' + id );

    item.value = respuesta.data;


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

  <AppCardActions
    v-model:loading="cargando"
    title="Editar {{ model }}"
    no-actions
  >

    <VCardText>

      <VList class="card-list mt-2">
        {{ camposForm }}
      </VList>

    </VCardText>

  </AppCardActions>

</template>

<style scoped lang="scss">

</style>
