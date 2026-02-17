<script setup lang="ts">
import Shepherd from 'shepherd.js'
import {useConfigStore} from '@core/stores/config'
import {can} from '@layouts/plugins/casl'
import type {RouteLocationRaw} from 'vue-router'
import {useIsMobile} from "@/composables/useIsMobile";
import {Icon} from "@iconify/vue";


const props = withDefaults(
  defineProps<{
    texto?: string
    icono?: string
    variante?: 'menu' | 'navbar'   // define el tipo de botón
    deshabilitado?: boolean        // controla text-disabled
  }>(),
  {
    texto: 'Buscar',
    icono: 'tabler-search',
    variante: 'navbar',
    deshabilitado: true,
  }
)


interface Sugerencia {
  icon: string
  title: string
  url: RouteLocationRaw
  action?: string
  subject?: string
}

interface ItemMenu {
  titulo: string
  icono?: string
  ruta?: string
  action?: string
  subject?: string
  titulo_seccion?: string
  children?: ItemMenu[]
}

interface GrupoSugerencias {
  title: string
  content: Sugerencia[]
}

defineOptions({inheritAttrs: false})

const configStore = useConfigStore()
const mostrarBuscador = ref(false)
const estaCargando = ref(false)
const elementosMenu = useState<ItemMenu[]>('menu', () => [])
const textoBusqueda = ref('')
const {isMobile} = useIsMobile()



function procesarRutaBuscador(link: any): any {
  // 1. Si no hay ruta, no podemos procesar nada
  if (!link.ruta || typeof link.ruta !== "string") {
    return { name: 'index' };
  }

  // 2. Lógica para rutas con parámetros (Ej: "credito", "Transunion" o IDs)
  if (link.params) {
    console.log('params',link.params)
    // Convertimos 'admin-configuraciones' a '/admin/configuraciones'
    const expectedPathBase = "/" + link.ruta.replace(/-/g, '/');

    // Construimos la ruta absoluta: "/admin/configuraciones/credito"
    // Esto asegura que el buscador te lleve al lugar exacto sin errores de JSON
    return `${expectedPathBase}/${link.params}`;
  }

  // 3. Si no tiene parámetros, retornamos el nombre para que Nuxt lo resuelva
  // Ej: { name: "admin-configuraciones" }
  return { name: link.ruta };
}
// 🔄 Aplana recursivamente los hijos
function aplanarMenu(menu: ItemMenu[]): Sugerencia[] {
  const resultado: Sugerencia[] = []

  for (const item of menu) {
    if (item.ruta) {
      resultado.push({
        icon: item.icono || 'tabler-menu',
        title: item.titulo,
        url: procesarRutaBuscador(item),
        action: item.action,
        subject: item.subject,
      })
    }
    if (item.children) {
      resultado.push(...aplanarMenu(item.children))
    }
  }

  return resultado
}

// 🔠 Agrupa por secciones + ítems sueltos
function agruparPorSeccion(menu: ItemMenu[]): GrupoSugerencias[] {
  const grupos: GrupoSugerencias[] = []
  let grupoActual: GrupoSugerencias | null = null

  const grupoGeneral: GrupoSugerencias = {
    title: 'General',
    content: [],
  }

  for (const item of menu) {
    if (item.titulo_seccion) {
      grupoActual = {
        title: item.titulo_seccion,
        content: [],
      }
      grupos.push(grupoActual)
    } else {
      const destino = grupoActual ?? grupoGeneral

      if (item.ruta) {
        destino.content.push({
          icon: item.icono || 'tabler-menu',
          title: item.titulo,
          url: {name: item.ruta},
          action: item.action,
          subject: item.subject,
        })
      }

      if (item.children) {
        destino.content.push(...aplanarMenu(item.children))
      }
    }
  }

  if (grupoGeneral.content.length) {
    grupos.unshift(grupoGeneral)
  }

  return grupos
}

// 🔍 Sugerencias agrupadas por búsqueda
const gruposSugerencias = computed(() => {
  console.log(elementosMenu.value)
  const agrupados = agruparPorSeccion(elementosMenu.value)

  const conPermisos = agrupados.map(grupo => ({
    title: grupo.title,
    content: grupo.content.filter(item =>
      item.url.name && can(item.action, item.subject)
    ),
  })).filter(grupo => grupo.content.length)

  if (!textoBusqueda.value) return conPermisos

  return conPermisos
    .map(grupo => ({
      title: grupo.title,
      content: grupo.content.filter(item =>
        item.title.toLowerCase().includes(textoBusqueda.value.toLowerCase())
      ),
    }))
    .filter(grupo => grupo.content.length)
})

// 🔄 En filas de 2 columnas
const filasGruposSugerencias = computed(() => {
  const filas: GrupoSugerencias[][] = []
  const grupos = gruposSugerencias.value

  for (let i = 0; i < grupos.length; i += 2) {
    filas.push(grupos.slice(i, i + 2))
  }

  return filas
})

// 🔁 Redirección
const router = useRouter()
const irASugerencia = (sugerencia: Sugerencia) => {
  router.push(sugerencia.url as string)
  cerrarBuscador()
}

const cerrarBuscador = () => {
  mostrarBuscador.value = false
  textoBusqueda.value = ''
}

watch(mostrarBuscador, visible => {
  if (!visible) textoBusqueda.value = ''
})

// ⛔ Fallback de sugerencias
const sugerenciasPorDefecto = computed(() => [
  {
    title: 'Inicio',
    icon: 'tabler-home',
    url: {name: 'index'},
  },
])

const BuscadorApp = defineAsyncComponent(() => import('@core/components/AppBarSearch.vue'))
</script>

<template>
  <div
    class="d-flex align-center cursor-pointer"
    v-bind="$attrs"
    style="user-select: none;"
  >
    <span
      v-if="configStore.appContentLayoutNav === 'vertical'"
      :class="[
      'd-md-flex align-center ms-2',
      deshabilitado ? 'text-disabled' : ''
      ]"
      @click="($event.stopPropagation(), mostrarBuscador = !mostrarBuscador)"
    >
      <!-- menu Movil -->
      <div v-if="variante === 'menu'" class="menu-content">
        <Icon
          class="nav-item-icon"
          :icon="props.icono"
          :class="{ 'is-active': mostrarBuscador }"
        />
        <span
          class="menu-text"
          :class="{ 'is-active': mostrarBuscador }"
        >
          {{ props.texto }}
        </span>
      </div>

      <!-- 📱 Mobile: solo ícono -->
      <template v-else>
        <span class="me-2">{{ props.texto }}</span>
        <VIcon
          v-if="isMobile"
          :icon="props.icono"
        />
        <span v-else class="meta-key">&#8984;K</span>
      </template>
    </span>

  </div>

  <BuscadorApp
    v-model:isNavegacionVisible="mostrarBuscador"
    :search-results="gruposSugerencias"
    :is-loading="estaCargando"
    @search="textoBusqueda = $event"
    @redirect="irASugerencia($event)"
  >
    <!-- 🔍 Resultados -->
    <template #suggestions>
      <div v-if="gruposSugerencias.length">
        <VRow
          v-for="(fila, idx) in filasGruposSugerencias"
          :key="idx"
        >
          <VCol
            v-for="grupo in fila"
            :key="grupo.title"
            cols="12"
            sm="6"
          >
            <p
              class="custom-letter-spacing text-disabled text-uppercase py-2 px-4 mb-0"
              style="font-size: 0.75rem; line-height: 0.875rem;"
            >
              {{ grupo.title }}
            </p>
            <VList class="card-list">
              <VListItem
                v-for="item in grupo.content"
                :key="item.title"
                class="app-bar-search-suggestion mx-4 mt-2"
                @click="irASugerencia(item)"
              >
                <VListItemTitle v-if="can(item.action, item.subject)">
                  {{ item.title }}
                </VListItemTitle>
                <template #prepend>
                  <VIcon
                    v-if="can(item.action, item.subject)"
                    :icon="item.icon"
                    size="20"
                    class="me-n1"
                  />
                </template>
              </VListItem>
            </VList>
          </VCol>
        </VRow>
      </div>
    </template>

    <!-- 🧭 Sugerencias por defecto si no hay resultados -->
    <template #noDataSuggestion>
      <div class="mt-9">
        <span class="d-flex justify-center text-disabled mb-2">Accesos rápidos</span>
        <h6
          v-for="sugerencia in sugerenciasPorDefecto"
          :key="sugerencia.title"
          class="app-bar-search-suggestion text-h6 font-weight-regular cursor-pointer py-2 px-4"
          @click="irASugerencia(sugerencia)"
        >
          <VIcon
            size="20"
            :icon="sugerencia.icon"
            class="me-2"
          />
          {{ sugerencia.title }}
        </h6>
      </div>
    </template>
  </BuscadorApp>
</template>

<style lang="scss">
.meta-key {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 1.5625rem;
  font-size: 0.8125rem;
  line-height: 1.3125rem;
  padding-block: 0.125rem;
  padding-inline: 0.25rem;
}

.app-bar-search-dialog {
  .custom-letter-spacing {
    letter-spacing: 0.8px;
  }

  .card-list {
    --v-card-list-gap: 8px;
  }
}

.app-bar-search-suggestion {
  transition: background 0.2s;
}

.app-bar-search-suggestion:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.menu-content .is-active {
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
