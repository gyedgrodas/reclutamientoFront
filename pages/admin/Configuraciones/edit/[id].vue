<script setup lang="ts">

definePageMeta({
  middleware: 'permissions',
  action: 'editar configuraciones', // Acción requerida
  subject: 'configuraciones',  // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
});

import fields from '@/views/pages/configuraciones/fields.vue'

import type { ConfiguracionInterface } from '@/types/configuraciones/index.ts';

import {ref} from "vue";

const { put, get  } = useClienteRequest();

const { showToastSuccess, showToastError } = useToast();

const route = useRoute();

const id = route.params.id;

const Configuracion = ref(fields);

const { paginaEspera } = useCargandoPagina();
const requestInProgress = ref(false); // Evitar solicitudes concurrentes

const actualizarConfiguracion = async ( Configuracion: ConfiguracionInterface ): Promise<void> => {

  if (!requestInProgress.value) {

    if (String(Configuracion.cifrado) === 'Si') {
      Configuracion.cifrado = Boolean(true);
    } else {
      Configuracion.cifrado = Boolean(false);
    }

    paginaEspera.value = true;
    requestInProgress.value = true;

    try {

      const respuesta = await put('/api/configuracions/' + id, Configuracion );

      showToastSuccess(respuesta.message);

      navigateTo('/configuraciones');

    } catch (error) {

      showToastError(error.message);

    } finally {

      paginaEspera.value = false;
      requestInProgress.value = false;

    }

  }

}

const itemConfiguracion = ref( <ConfiguracionInterface>
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

    if (respuesta.data.cifrado) {
      respuesta.data.cifrado = 'Si';
    } else {
      respuesta.data.cifrado = 'No';
    }

    itemConfiguracion.value = respuesta.data;

  } catch (error: { message: string }) {

    showToastError(error.message);

  }

  paginaEspera.value = false;

}

getConfiguracion();

const puedeMostrarDatos = computed(() => {

  return Object.values(itemConfiguracion .value).some(valor => valor !== null && valor !== undefined);

});

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

      <VCardTitle>Editar Configuracion</VCardTitle>

    </VCardItem>

      <VCardText>

        <fields :fields="fields"
                v-if="puedeMostrarDatos"
                :item="itemConfiguracion"
                @emitirDatos="actualizarConfiguracion"
        />

      </VCardText>

  </VCard>

</template>

<style scoped lang="scss">

</style>
