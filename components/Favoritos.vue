<script setup lang="ts">

import {onMounted, ref, type Ref} from "vue";
import Sortable from "sortablejs";
import type {SortableEvent} from "sortablejs";
import type {UsuarioInterface} from "@/types/usuarios/index";
import {useTheme} from 'vuetify'
const ability = useAbility();

const {get, put} = useClienteRequest();
const user = useSanctumUser<UsuarioInterface>();
const {showToastError, showToastSuccess} = useToast();
const vuetifyTheme = useTheme()

import type {MenuOpcion, RespuestaRequest} from "@/types/admin/menuOpciones/types";
import {useAbility} from "@casl/vue";

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

const obtenerFavoritosAElegir = (): void => {

  try {

    let favoritosDelMenu = <MenuOpcion[]>useState('menu').value;

    for (let opcion of <MenuOpcion[]>aplarOpciones(favoritosDelMenu) ) {

      if (!idsFavoritos.value.includes(opcion.id) && opcion.titulo_seccion === null && opcion.ruta !== null) {

        if(ability.can(opcion.action, opcion.subject)){

          favoritosAElegir.value.push(opcion);

        }

      }

    }

  } catch (error) {

    showToastError('Error al obtener los favoritos a elegir');

  }

}

const aplarOpciones = (options: MenuOpcion[]): MenuOpcion[] => {

  let flattened: MenuOpcion[] = [];

  for (const option of options) {

    const {children, ...currentOption} = option;
    flattened.push(currentOption as MenuOpcion);

    if (children && Array.isArray(children)) {
      flattened = flattened.concat(aplarOpciones(children));
    }
  }

  return flattened;

}

obtenerFavoritos();

const sincronizarCambios = (event: SortableEvent): void => {
  const oldIndex = event.oldIndex as number;
  const newIndex = event.newIndex as number;

  const fromList = event.from === favoritosList.value ? favoritos : favoritosAElegir;
  const toList = event.to === favoritosList.value ? favoritos : favoritosAElegir;

  if (fromList === favoritosAElegir && toList === favoritosAElegir) {
    return;
  }

  const [movedItem] = fromList.value.splice(oldIndex, 1);
  toList.value.splice(newIndex, 0, movedItem);

  if (fromList === favoritos || toList === favoritos) {
    actualizarFavoritos();
  }
};


const actualizarFavoritos = async (): Promise<void> => {

  try {

    const response: RespuestaRequest = await put('api/user-favoritos/' + user.value?.id, {
      favoritos: favoritos.value.map(favorito => favorito.id)
    });

    showToastSuccess(response.message);

  } catch (e: any) {

    showToastError(e.message);

  }

}

let sortableFavoritosAElegir: Sortable | null = null;
let sortableFavoritos: Sortable | null = null;

watch(estaEditando, async (value) => {

  if (value) {

    await nextTick();

    if (favoritosAElegirList.value) {

      sortableFavoritosAElegir = new Sortable(favoritosAElegirList.value, {
        group: "shared",
        animation: 150,
        onEnd: sincronizarCambios,
        ghostClass: "ghost",
        fallbackOnBody: true,
        emptyInsertThreshold: 5,
        sort: false,
      });

    }

    if (favoritosList.value) {

      sortableFavoritos =  new Sortable(favoritosList.value, {
        group: "shared",
        animation: 150,
        onEnd: sincronizarCambios,
      });

    }

  }else {

    if (sortableFavoritos) {
      sortableFavoritos.destroy();
      sortableFavoritos = null;
    }

    if (sortableFavoritosAElegir) {
      sortableFavoritosAElegir.destroy();
      sortableFavoritosAElegir = null;
    }

  }

});

const colorTema = ref(vuetifyTheme.global.name.value)

const colorPrimary = ref<string>('')

watchEffect(() => {
  const isDarkMode = colorTema.value === 'dark'

  colorPrimary.value = isDarkMode
    ? vuetifyTheme.themes.value.dark.colors.primary
    : vuetifyTheme.themes.value.light.colors.primary

})

const manejarRuta = (ruta: string): void => {

  navigateTo( { name: ruta } );

}

</script>

<template>

    <div class="d-flex flex-wrap justify-end justify-sm-space-between">

      <p class="text-h4">
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
        class="parent-list d-flex flex-wrap v-col-12"
        style="list-style-type: none; padding: 0; min-height: 150px; "
      >
        <li
          v-for="(item, index) in favoritos"
          :key="item.id"
          class="v-col-3"
        >

          <VCard
            class="v-col-12 text-center cursor-pointer"
            @click="manejarRuta(item.ruta)"
          >
            <VBtn
              size="x-large"
              class="ma-1"
              :style="{background: colorPrimary}"
              :icon="item.icono"
            >
            </VBtn>
            <p></p>
            <span > {{ item?.titulo }} </span>

          </VCard>

        </li>
      </ul>

      <div v-if="estaEditando" class="v-col-12 border-b"></div>

      <p class="text-2xl" v-if="estaEditando">
        Favoritos a elegir
      </p>

      <ul v-if="estaEditando"
          ref="favoritosAElegirList"
          class="parent-list d-flex flex-wrap v-col-12"
          style="list-style-type: none; padding: 0; min-height: 150px; "
      >
        <li
          v-for="(item, index) in favoritosAElegir"
          :key="item.id"
          class="v-col-3"
        >
          <VCard
            class="v-col-12 text-center cursor-pointer"

          >
            <VBtn
              size="x-large"
              class="ma-1"
              :style="{background: colorPrimary}"
              :icon="item.icono"
            >
            </VBtn>
            <p></p>
            <span> {{ item?.titulo }} </span>
          </VCard>
        </li>
      </ul>

    </VCol>



</template>

<style scoped lang="scss">

</style>


