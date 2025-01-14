<script lang="ts" setup>

import Fields from '@/views/admin/menuOpciones/fields.vue';
import type {MenuOpcion} from "@/types/admin/menuOpciones/types";

const {put, get} = useClienteRequest();

const {showToastSuccess, showToastError} = useToast();

const {paginaEspera} = useCargandoPagina();

const route = useRoute<{ id: number }>();

const id = <number>route.params.id;

const opcion = ref<MenuOpcion>({} as MenuOpcion);

const actualizarOpcion = async (opcion: MenuOpcion): Promise<void> => {

  try {

    paginaEspera.value = true;

    const response = await put(`api/menu_opciones/${id}`, opcion);

    showToastSuccess(response.message);

    navigateTo("/admin/menu");

  } catch (error: any) {

    showToastError(error.message);

  } finally {

    paginaEspera.value = false;

  }

};

const getOpcion = async (): Promise<void> => {

  try {

    paginaEspera.value = true;

    const response: { data: MenuOpcion } = await get(`api/menu_opciones/${id}`);

    opcion.value = response.data;

  } catch (error: { message: string }) {

    showToastError(error.message);

  } finally {

    paginaEspera.value = false;

  }


};

getOpcion();

const puedeMostrarDatos = computed(() => {

  return Object.values(opcion.value).some(valor => valor !== null && valor !== undefined);

});

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

    <VCardTitle>Editar Opción</VCardTitle>

    <VCardText>

      <Fields v-if="puedeMostrarDatos"
              :item="opcion"
              :mostrar-titulo-seccion="false"
              :parent-id="null"
              @datos="actualizarOpcion"
      />

    </VCardText>

  </VCard>

</template>

<style lang="scss" scoped>

</style>
