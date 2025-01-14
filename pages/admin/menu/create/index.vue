<script lang="ts" setup>

import Fields from '@/views/admin/menuOpciones/fields.vue';
import type {MenuOpcion} from "@/types/admin/menuOpciones/types";

const {post} = useClienteRequest();
const {paginaEspera} = useCargandoPagina();
const {showToastError, showToastSuccess} = useToast();

const guardarOpcion = async (data: MenuOpcion) => {

  paginaEspera.value = true;

  try {

    let res: { message: string } = await post('api/menu_opciones', data);

    showToastSuccess(res.message);

    navigateTo('/admin/menu');

  } catch (error: { message: string }) {

    showToastError(error.message);

  } finally {

    paginaEspera.value = false;

  }

}

</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="secondary"
      to="/admin/menu"
    >
      Regresar
    </VBtn>
  </div>

  <VCard>

    <VCardTitle>Crear una nueva Opcion</VCardTitle>

    <VCardText>

      <Fields :item="{}"
              :mostrar-titulo-seccion="true"
              :parentId="null"
              @Datos="guardarOpcion"
      />

    </VCardText>

  </VCard>


</template>
