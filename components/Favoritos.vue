<script setup lang="ts">

import {onMounted, ref, type Ref} from "vue";
import Sortable from "sortablejs";
import type { SortableEvent } from "sortablejs";
import type { UsuarioInterface } from "@/types/usuarios/index";

const {get,put} = useClienteRequest();
const user = useSanctumUser<UsuarioInterface>();
const {showToastError, showToastSuccess} = useToast();

import type {MenuOpcion, RespuestaRequest} from "@/types/admin/menuOpciones/types";

const favoritos = ref<MenuOpcion[]>([]);

let favoritosAElegir = ref<MenuOpcion[]>([]);

const estaEditando = ref(false)

const idsFavoritos = computed(() => {

  return favoritos.value.map(favorito => favorito.id);

})

const favoritosList: Ref<HTMLElement | null> = ref(null);
const favoritosAElegirList: Ref<HTMLElement | null> = ref(null);

const obtenerFavoritos = async (): Promise<void> => {

  try {

    const response: RespuestaRequest = await get('api/user-favoritos/de/usuario');

    favoritos.value = <MenuOpcion[]>response.data;

    obtenerFavoritosAElegir()

  } catch (error: any) {

    showToastError(error.message);

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

obtenerFavoritos();

const sincronizarCambios = (event:SortableEvent):void => {
  const oldIndex = event.oldIndex as number;
  const newIndex = event.newIndex as number;

  const fromList = event.from === favoritosList.value ? favoritos : favoritosAElegir;
  const toList = event.to === favoritosList.value ? favoritos : favoritosAElegir;

  const [movedItem] = fromList.value.splice(oldIndex, 1);
  toList.value.splice(newIndex, 0, movedItem);

  actualizarFavoritos();

};

const actualizarFavoritos = async (): Promise<void> => {

  try {

    const response: RespuestaRequest = await put('api/user-favoritos/'+user.value?.id, {
      favoritos: favoritos.value.map(favorito => favorito.id)
    });

    showToastSuccess(response.message);

  } catch (e: any) {

    showToastError(e.message);

  }

}

onMounted(() => {

  if(favoritosList.value){

    new Sortable(favoritosList.value, {
      group: "shared", // Grupo compartido
      animation: 150,
      onEnd: sincronizarCambios,
    });

  } else {

    showToastError('No se pudo cargar la lista de favoritos');

  }

});

watch(estaEditando, async (value)  => {

  if (value) {

    await nextTick();

    if (favoritosAElegirList.value) {

      new Sortable(favoritosAElegirList.value, {
        group: "shared",
        animation: 150,
        onEnd: sincronizarCambios,
      });

    } else {

      showToastError('No se pudo cargar la lista de favoritos');

    }

  }

});

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
        @click="estaEditando = !estaEditando"
        v-if="!estaEditando"
      >
        <VIcon
          icon="tabler-edit"
        />
        Editar Favoritos
      </VBtn>

      <VBtn
        class="ml-auto"
        color="success"
        @click="estaEditando = !estaEditando"
        v-if="estaEditando"
      >
        <VIcon
          icon="tabler-edit"
        />
        Guardar
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
            class="v-col-12 text-center cursor-pointer"
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

      <div v-if="estaEditando" class="v-col-12 border-b"></div>

      <ul v-if="estaEditando"
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
            class="v-col-12 text-center cursor-pointer"
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
