<script setup>
const props = defineProps({
  tipo: {
    type: String,
    required: true,
  },
  ItemsDisponibles: {
    type: Array,
    default: () => [],
  },
  ItemsSeleccionadas: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: 'name',
  },
  lectura: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:ItemsSeleccionadas',
  'itemAgregada',
  'itemQuitada',
])

const disponibles = ref([])
const seleccionadas = ref([])

const searchDisponible = ref('')
const searchSeleccionada = ref('')

// Arrays para almacenar items seleccionados temporalmente
const itemsDisponiblesSeleccionados = ref([])
const itemsSeleccionadasSeleccionados = ref([])

const inicializarItems = () => {
  seleccionadas.value = Array.isArray(props.ItemsSeleccionadas) ? [...props.ItemsSeleccionadas] : []
  disponibles.value = Array.isArray(props.ItemsDisponibles)
    ? props.ItemsDisponibles.filter(
      item => !seleccionadas.value.some(sel => sel.id === item.id),
    )
    : []
  // Limpiar selecciones temporales
  itemsDisponiblesSeleccionados.value = []
  itemsSeleccionadasSeleccionados.value = []
}

watch(
  () => [props.ItemsDisponibles, props.ItemsSeleccionadas],
  () => {
    inicializarItems()
  },
  {immediate: true, deep: true},
)

const disponiblesFiltrados = computed(() =>
  disponibles.value.filter(item =>
    item[props.label] && item[props.label].toLowerCase().includes(searchDisponible.value.toLowerCase())
  ),
)

const seleccionadasFiltradas = computed(() =>
  seleccionadas.value?.filter(item =>
    item[props.label] && item[props.label].toLowerCase().includes(searchSeleccionada.value?.toLowerCase() || ''),
  ) || [],
)

// Función para alternar selección de un item disponible
const toggleSeleccionDisponible = (item) => {
  if (props.lectura) return
  const index = itemsDisponiblesSeleccionados.value.findIndex(i => i.id === item.id)
  if (index === -1) {
    itemsDisponiblesSeleccionados.value.push(item)
  } else {
    itemsDisponiblesSeleccionados.value.splice(index, 1)
  }
}

// Función para alternar selección de un item seleccionado
const toggleSeleccionSeleccionada = (item) => {
  if (props.lectura) return
  const index = itemsSeleccionadasSeleccionados.value.findIndex(i => i.id === item.id)
  if (index === -1) {
    itemsSeleccionadasSeleccionados.value.push(item)
  } else {
    itemsSeleccionadasSeleccionados.value.splice(index, 1)
  }
}

// Verificar si un item está seleccionado temporalmente
const estaSeleccionadoDisponible = (item) => {
  return itemsDisponiblesSeleccionados.value.some(i => i.id === item.id)
}

const estaSeleccionadoSeleccionada = (item) => {
  return itemsSeleccionadasSeleccionados.value.some(i => i.id === item.id)
}

// Mover items seleccionados a la derecha
const moverSeleccionadosADerecha = () => {
  if (itemsDisponiblesSeleccionados.value.length === 0) return

  itemsDisponiblesSeleccionados.value.forEach(item => emit('itemAgregada', item))
  seleccionadas.value.push(...itemsDisponiblesSeleccionados.value)
  disponibles.value = disponibles.value.filter(
    item => !itemsDisponiblesSeleccionados.value.some(sel => sel.id === item.id)
  )
  itemsDisponiblesSeleccionados.value = []
  emit('update:ItemsSeleccionadas', seleccionadas.value)
}

// Mover items seleccionados a la izquierda
const moverSeleccionadosAIzquierda = () => {
  if (itemsSeleccionadasSeleccionados.value.length === 0) return

  itemsSeleccionadasSeleccionados.value.forEach(item => emit('itemQuitada', item))
  disponibles.value.push(...itemsSeleccionadasSeleccionados.value)
  seleccionadas.value = seleccionadas.value.filter(
    item => !itemsSeleccionadasSeleccionados.value.some(sel => sel.id === item.id)
  )
  itemsSeleccionadasSeleccionados.value = []
  emit('update:ItemsSeleccionadas', seleccionadas.value)
}

// Mover todos los items a la derecha
const moverTodosADerecha = () => {
  disponibles.value.forEach(item => emit('itemAgregada', item))
  seleccionadas.value.push(...disponibles.value)
  disponibles.value = []
  itemsDisponiblesSeleccionados.value = []
  emit('update:ItemsSeleccionadas', seleccionadas.value)
}

// Mover todos los items a la izquierda
const moverTodosAIzquierda = () => {
  seleccionadas.value.forEach(item => emit('itemQuitada', item))
  disponibles.value.push(...seleccionadas.value)
  seleccionadas.value = []
  itemsSeleccionadasSeleccionados.value = []
  emit('update:ItemsSeleccionadas', seleccionadas.value)
}
</script>

<template>
  <VRow align="stretch" justify="center" class="flex-wrap">
    <!-- Lista disponibles -->
    <VCol cols="12" md="5" class="mb-4 mb-md-0">
      <VCard elevation="3" rounded="lg" class="d-flex flex-column" style="min-height: 400px; max-height: 500px;">
        <VCardTitle class="text-center text-subtitle-1">
          {{ props.tipo }} Disponibles
        </VCardTitle>
        <VCardText class="flex-column flex-grow-1">
          <VTextField
            v-model="searchDisponible"
            :label="`Buscar en ${props.tipo} Disponibles`"
            prepend-inner-icon="tabler-search"
            variant="outlined"
            class="mb-3"
          />
          <div class="scrollable-list">
            <VList v-if="disponiblesFiltrados.length" density="compact" class="no-padding">
              <VListItem
                v-for="item in disponiblesFiltrados"
                :key="item.id"
                class="no-padding no-hover"
                @click="toggleSeleccionDisponible(item)"
              >
                <div
                  class="item-content"
                  :class="{
                    'selected': estaSeleccionadoDisponible(item),
                    'cursor-pointer': !props.lectura,
                    'lectura-mode': props.lectura
                  }"
                >
                  <div class="d-flex align-center justify-between">
                    <span>{{ item[props.label] }}</span>
                    <slot name="item-disponible" :item="item" />
                  </div>
                </div>
              </VListItem>
            </VList>
            <div v-else class="text-center text-medium-emphasis py-2">
              No hay {{ props.tipo }} disponibles.
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Botones -->
    <VCol cols="12" md="1" class="d-flex flex-row flex-md-column align-center justify-center my-2 gap-2">
      <VBtn
        color="primary"
        variant="tonal"
        density="compact"
        title="Mover todos a la derecha"
        :disabled="props.lectura"
        @click="moverTodosADerecha"
      >
        <VIcon>tabler-chevrons-right</VIcon>
      </VBtn>
      <VBtn
        color="primary"
        variant="tonal"
        density="compact"
        :disabled="itemsDisponiblesSeleccionados.length === 0"
        title="Mover seleccionados a la derecha"
        @click="moverSeleccionadosADerecha"
      >
        <VIcon>tabler-chevron-right</VIcon>
      </VBtn>
      <VBtn
        color="primary"
        variant="tonal"
        density="compact"
        :disabled="itemsSeleccionadasSeleccionados.length === 0"
        title="Mover seleccionados a la izquierda"
        @click="moverSeleccionadosAIzquierda"
      >
        <VIcon>tabler-chevron-left</VIcon>
      </VBtn>
      <VBtn
        color="primary"
        variant="tonal"
        density="compact"
        title="Mover todos a la izquierda"
        :disabled="props.lectura"
        @click="moverTodosAIzquierda"
      >
        <VIcon>tabler-chevrons-left</VIcon>
      </VBtn>
    </VCol>

    <!-- Lista seleccionadas -->
    <VCol cols="12" md="5">
      <VCard elevation="3" rounded="lg" class="h-100 d-flex flex-column">
        <VCardTitle class="text-center text-subtitle-1">
          {{ props.tipo }} Seleccionados
        </VCardTitle>
        <VCardText class="flex-column flex-grow-1">
          <VTextField
            v-model="searchSeleccionada"
            :label="`Buscar en ${props.tipo} Seleccionados`"
            prepend-inner-icon="tabler-search"
            variant="outlined"
            class="mb-3"
          />
          <div class="scrollable-list">
            <VList
              v-if="seleccionadasFiltradas.length"
              density="compact"
              class="no-padding"
            >
              <VListItem
                v-for="item in seleccionadasFiltradas"
                :key="item.id"
                class="no-padding no-hover"
                @click="toggleSeleccionSeleccionada(item)"
              >
                <div
                  class="item-content"
                  :class="{
                    'selected': estaSeleccionadoSeleccionada(item),
                    'cursor-pointer': !props.lectura,
                    'lectura-mode': props.lectura
                  }"
                >
                  <div class="d-flex align-center justify-between">
                    <span>{{ item[props.label] }}</span>
                    <slot name="item-seleccionado" :item="item"/>
                  </div>
                </div>
              </VListItem>
            </VList>
            <div v-else class="text-center text-medium-emphasis py-2">
              No hay {{ props.tipo }} seleccionados.
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.bg-primary {
  background-color: rgb(var(--v-theme-primary)) !important;
}

.text-white {
  color: white !important;
}

.text-center {
  text-align: center;
}

.scrollable-list {
  max-height: 300px;
  overflow-y: auto;
  border-radius: 8px;
  padding: 8px;
}

.item-content {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 6px;
  box-sizing: border-box;
  transition: background-color 0.2s ease;
}

.item-content:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.item-content.selected {
  background-color: rgb(var(--v-theme-primary));
  color: white;
}

.no-padding {
  padding: 0 !important;
  margin: 0 !important;
  min-height: auto !important;
}

.no-hover::before {
  content: none !important;
  background: transparent !important;
}

.item-content:focus {
  outline: none;
}

.lectura-mode {
  cursor: default !important;
  opacity: 0.8;
}

.lectura-mode:hover {
  background-color: transparent !important;
  color: inherit !important;
}
</style>
