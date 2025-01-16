<script lang="ts" setup>

import Fields from '@/views/admin/menuOpciones/fields.vue';
import type {MenuOpcion, RespuestaRequest} from "@/types/admin/menuOpciones/types";

const route = useRoute<{ parentId: number }>();

const parentId = <number>route.params.parentId;

const {post} = useClienteRequest();
const {paginaEspera} = useCargandoPagina();
const {showToastError, showToastSuccess} = useToast();

const menu = useState('menu');

const guardarOpcion = async (data: MenuOpcion) => {

  paginaEspera.value = true;

  let datos = {
    ...data,
    parent_id: parentId
  };

  try {

    let res: RespuestaRequest = await post('api/menu_opciones', datos);

    showToastSuccess(res.message);

    menu.value = res.data;

    navigateTo('/admin/menu');

  } catch (error: { message: string }) {

    showToastError(error.message);

  } finally {

    paginaEspera.value = false;

  }

}

</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6">

    <p class="text-2xl">
      Editar Menu
    </p>

    <VBtn
      class="ml-auto"
      color="secondary"
      @click="navigateTo('/admin/menu')"
    >
      Regresar
    </VBtn>
  </div>

  <VCard>

    <VCardTitle>Crear opcion Hija</VCardTitle>

    <VCardText>

      <Fields :item="{}"
              :mostrar-titulo-seccion="false"
              :parentId="parentId"
              @Datos="guardarOpcion"
      />

    </VCardText>

  </VCard>


</template>
