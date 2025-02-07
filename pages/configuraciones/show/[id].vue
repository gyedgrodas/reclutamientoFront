<script setup lang="ts">

definePageMeta({
  middleware: 'permissions',
  action: 'ver configuraciones', // Acción requerida
  subject: 'configuraciones',  // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
});

import type { ConfiguracionInterface } from '@/types/configuraciones/index.ts';

import {ref} from "vue";

const { get } = useClienteRequest();

const { showToastSuccess, showToastError } = useToast();

const route = useRoute();

const id = route.params.id;

const { paginaEspera } = useCargandoPagina();

const item = ref( <ConfiguracionInterface>
{ nombre: null,
valor: null,
cifrado: null,
tipo: null,
grupo: null,
descripcion: null,
})

const getConfiguracion = async () => {

  try {

    paginaEspera.value = true;

    const respuesta: { data: ConfiguracionInterface } = await get('/api/configuracions/' + id );

    if (String(respuesta.data.cifrado) === 'true') {
      respuesta.data.cifrado = 'Si';
    } else {
      respuesta.data.cifrado = 'No';
    }

    item.value = respuesta.data;


  } catch (error: { message: string }) {

    showToastError(error.message);

  }

  paginaEspera.value = false;

}

const puedeMostrarDatos = computed(() => {

  return Object.values(item.value).some(valor => valor !== null && valor !== undefined);

});

getConfiguracion();

</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="secondary"
      to="/configuraciones/"
    >
      Regresar
    </VBtn>
  </div>

  <VCard>

    <VCardItem>

      <VCardTitle>Visualizar Configuracion</VCardTitle>

      <VRow class="card-list mt-2" v-if="puedeMostrarDatos">

        <VCol cols="12"
              md="6"
        >
          <AppTextField
            v-model="item.nombre"
            label="Nombre"
            disabled="disabled"
          />
        </VCol>

        <VCol cols="12"
              md="6"
        >
          <AppTextField
            v-model="item.valor"
            label="Valor"
            disabled="disabled"
          />
        </VCol>

        <VCol
          cols="12"
          md="6"
        >
          <AppTextField
            v-model="item.tipo"
            label="Tipos"
            disabled="disabled"
          />
        </VCol>

        <VCol cols="12"
              md="6"
        >
          <AppTextField
            v-model="item.grupo"
            label="Grupo"
            disabled="disabled"
          />
        </VCol>

        <VCol cols="12"
              md="12"
        >
          <AppTextarea
            v-model="item.descripcion"
            label="Descripción"
            disabled="disabled"
          />
        </VCol>

        <VCol cols="12"
              md="6"
        >
          <AppTextField
            v-model="item.cifrado"
            label="Cifrado"
            disabled="disabled"
          />
        </VCol>
      </VRow>

    </VCardItem>

  </VCard>

</template>

<style scoped lang="scss">

</style>
