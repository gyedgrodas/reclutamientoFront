<script setup lang="ts">

import {onMounted, ref} from "vue";

import Sortable from "sortablejs";

const {get,put} = useClienteRequest();

const { user } = useSanctumAuth();

const {showToastError, showToastSuccess} = useToast();

import type {MenuOpcion, RespuestaRequest, RespuestaRequestError} from "@/types/admin/menuOpciones/types";

const favoritos = ref<MenuOpcion[]>([]);

let favoritosAElegir = ref<MenuOpcion[]>([]);

const obtenerFavoritos = async () => {

  try {

    const response: RespuestaRequest = await get('api/user-favoritos/de/usuario');

    favoritos.value = <MenuOpcion[]>response.data;

    obtenerFavoritosAElegir()

  } catch (error) {

    showToastError('Error al obtener los favoritos');

  }

}

const obtenerFavoritosAElegir = ():void => {

  try {

    let favoritosDelMenu = <MenuOpcion[]>useState('menu').value;

    for (let opcion of favoritosDelMenu) {

      if (!idsFavoritos.value.includes(opcion.id) && opcion.titulo_seccion === null) {

        favoritosAElegir.value.push(opcion);

      }

    }

  } catch (error) {

    showToastError('Error al obtener los favoritos a elegir');

  }

}

obtenerFavoritos()

const idsFavoritos = computed(() => {

  return favoritos.value.map(favorito => favorito.id);

})

const favoritosList = ref(null);

const favoritosAElegirList = ref(null);

onMounted(() => {
  const sincronizarCambios = (event) => {
    const fromList = event.from === favoritosList.value ? favoritos : favoritosAElegir;
    const toList = event.to === favoritosList.value ? favoritos : favoritosAElegir;

    const [movedItem] = fromList.value.splice(event.oldIndex, 1);
    toList.value.splice(event.newIndex, 0, movedItem);

    actualizarFavoritos();

    console.log("Estado actual de favoritos:", favoritos.value);
    console.log("Estado actual de favoritosAElegir:", favoritosAElegir.value);
  };

  new Sortable(favoritosList.value, {
    group: "shared", // Grupo compartido
    animation: 150,
    onEnd: sincronizarCambios,
  });

  new Sortable(favoritosAElegirList.value, {
    group: "shared", // Grupo compartido
    animation: 150,
    onEnd: sincronizarCambios,
  });
});

const actualizarFavoritos = async () => {

  try {

    const response: RespuestaRequest = await put('api/user-favoritos/'+user.value.id, {
      favoritos: favoritos.value.map(favorito => favorito.id)
    });

    showToastSuccess(response.message);

  } catch (error: RespuestaRequestError) {

    showToastError(error.message);

  }

}

</script>

<template>

  <VContainer>
    <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 ">

      <p class="text-2xl">
         Favoritos
      </p>

      <VBtn
        class="ml-auto"
        color="warning"
      >
        <VIcon
          icon="tabler-edit"
        />
        Editar Favoritos
      </VBtn>
    </div>

    <VCol>

      <ul
        ref="favoritosList"
        class="parent-list d-flex flex-nowrap v-col-12"
        style="list-style-type: none; padding: 0;"
      >
        <li
          v-for="(item, index) in favoritos"
          :key="item.id"
          class="v-col-3"
        >
          <VCard
            class="v-col-12 text-center"
          >
            <VIcon
              size="40"
              :icon="item.icono"
            />
            <p></p>
            {{item?.titulo}}
          </VCard>
        </li>
      </ul>

      <div class="v-col-12 border-b"></div>

      <ul
        ref="favoritosAElegirList"
        class="parent-list d-flex flex-nowrap v-col-12"
        style="list-style-type: none; padding: 0; margin-top: 16px;"
      >
        <li
          v-for="(item, index) in favoritosAElegir"
          :key="item.id"
          class="v-col-3"
        >
          <VCard
            class="v-col-12 text-center"
          >
            <VIcon
              size="40"
              :icon="item.icono"
            />
            <p></p>
            <span v-text="item.titulo"></span>
          </VCard>
        </li>
      </ul>

    </VCol>

  </VContainer>

</template>

<style scoped lang="scss">

</style>
