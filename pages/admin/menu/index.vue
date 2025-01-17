<style scoped>

</style>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 ">

    <p class="text-2xl">
      Administrar Menu
    </p>

    <VBtn
      class="ml-auto"
      color="success"
      to="/admin/menu/create"
    >
      Nueva Opción
    </VBtn>
  </div>

  <VCard>

    <VCardText>

      <ListaOpciones :opciones="opcionesMenu"
                     @ItemsActualizadas="actualizarOpciones"
      />

    </VCardText>

  </VCard>

</template>

<script lang="ts" setup>

const {post} = useClienteRequest();
const {showToastSuccess, showToastError} = useToast();
const {paginaEspera} = useCargandoPagina();

import ListaOpciones from '@/views/admin/menuOpciones/components/ListaOpciones.vue';
import type {MenuOpcion, RespuestaRequest} from "@/types/admin/menuOpciones/types";

const opcionesMenu = <[]>useState('menu');

const actualizarOpciones = async (opciones): Promise<void> => {

  let opcionesAplanadas = flattenOptions(opciones);

  try {

    let data = {
      opciones: opcionesAplanadas
    };

    paginaEspera.value = true;

    const respuesta: RespuestaRequest = await post('api/menu_opciones/actualizar/orden', data);

    opcionesMenu.value = respuesta.data;

    showToastSuccess(respuesta.message);

  } catch (error) {

    showToastError(error.message);

  } finally {

    paginaEspera.value = false;

  }


};


function flattenOptions(options: MenuOpcion[]): MenuOpcion[] {

  let flattened: MenuOpcion[] = [];

  for (const option of options) {

    const {children, ...currentOption} = option;
    flattened.push(currentOption as MenuOpcion);

    if (children && Array.isArray(children)) {
      flattened = flattened.concat(flattenOptions(children));
    }
  }

  return flattened;

}

</script>
