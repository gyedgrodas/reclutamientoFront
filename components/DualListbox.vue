<script lang="ts" setup>
import { computed, defineProps, ref, watch } from 'vue'

const props = defineProps({
  itemsDisponibles: {
    type: Array,
    default: () => [],
    required: true,
  },
  itemsSeleccionados: {
    type: Array,
    default: () => [],
    required: true,
  },
  tipo: {
    type: String,
    required: true,
  },
})


// Emisión de eventos
const emit = defineEmits(['update:selected'])

const itemsDisponibles = ref([])
const selectedItems = ref([])

const inicializarItems = () => {
  selectedItems.value = props.itemsSeleccionados
  itemsDisponibles.value = props.itemsDisponibles.filter(
    item => !props.itemsSeleccionados.some(selected => selected.id === item.id),
  )
}

watch(
  () => [props.itemsDisponibles, props.itemsSeleccionados],
  ([newAvailable, newSelected]) => {
    inicializarItems(newAvailable, newSelected)
  },
  { immediate: true, deep: true }, // Observa cambios profundos y ejecuta al inicio
)

// Campos de búsqueda
const searchAvailable = ref('')
const searchSelected = ref('')

// Items filtrados según búsqueda
const filteredAvailableItems = computed(() => {
  return itemsDisponibles.value.filter(item =>
    item.name.toLowerCase().includes(searchAvailable.value.toLowerCase()),
  )
})

const filteredSelectedItems = computed(() => {
  return selectedItems.value.filter(item =>
    item.name.toLowerCase().includes(searchSelected.value.toLowerCase()),
  )
})

// Mover un item a la lista de seleccionados
const addItem = (item: any) => {
  console.log(item)
  itemsDisponibles.value = itemsDisponibles.value.filter(r => r.id !== item.id)
  selectedItems.value.push(item)
  emit('update:selected', selectedItems.value)
}

// Mover un item a la lista de disponibles
const removeItem = (item: any) => {
  console.log(item)
  selectedItems.value = selectedItems.value.filter(r => r.id !== item.id)
  itemsDisponibles.value.push(item)
  emit('update:selected', selectedItems.value)
}

// Mover todos los items a la lista de seleccionados
const addAllItems = () => {
  selectedItems.value.push(...itemsDisponibles.value)
  itemsDisponibles.value = []
  emit('update:selected', selectedItems.value)
}

// Mover todos los items a la lista de disponibles
const removeAllItems = () => {
  itemsDisponibles.value.push(...selectedItems.value)
  selectedItems.value = []
  emit('update:selected', selectedItems.value)
}

// Obtener el color principal desde la cookie
const colorActual
  = useCookie('cobranza-theme').value === 'light'
    ? useCookie('cobranza-lightThemePrimaryColor').value
    : useCookie('cobranza-darkThemePrimaryColor').value

// Aplicar dinámicamente el color al hover
document.documentElement.style.setProperty('--button-hover-color', colorActual)
</script>

<template>
  <VContainer>
    <VRow>
      <VCol cols="12">
        <h2 class="text-center">
          {{ `Selector de ${props.tipo}` }}
        </h2>
      </VCol>
    </VRow>

    <VRow class="d-flex justify-center">
      <!-- Items Disponibles -->
      <VCol cols="5">
        <VCard>
          <VCardTitle class="text-h6 text-center">
            {{ props.tipo }} Disponibles
          </VCardTitle>
          <VCardText>
            <VTextField
              v-model="searchAvailable"
              :label="`Buscar en ${props.tipo} Disponibles`"
              dense
              outlined
            />
            <VList
              v-if="filteredAvailableItems.length > 0"
              class="scrollable-list"
            >
              <VListItem
                v-for="item in filteredAvailableItems"
                :key="item.id"
                class="clickable-text v-list-item "
                @click="addItem(item)"
              >
                <span>{{ item.name }}</span>
              </VListItem>
            </VList>
            <p
              v-else
              class="text-center"
            >
              No hay {{ props.tipo }} disponibles.
            </p>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Botones de mover todo -->
      <VCol
        cols="1"
        class="d-flex flex-column align-center justify-center"
      >
        <VBtn
          icon="tabler-arrow-big-right-line"
          color="primary"
          dense
          class="mb-4"
          @click="addAllItems"
        />
        <VBtn
          icon="tabler-arrow-big-left-line"
          color="primary"
          dense
          @click="removeAllItems"
        />
      </VCol>

      <!-- Items Seleccionados -->
      <VCol cols="5">
        <VCard>
          <VCardTitle class="text-h6 text-center">
            {{ props.tipo }} Seleccionados
          </VCardTitle>
          <VCardText>
            <VTextField
              v-model="searchSelected"
              :label="`Buscar en ${props.tipo} Seleccionados`"
              dense
              outlined
            />
            <VList
              v-if="filteredSelectedItems.length > 0"
              class="scrollable-list"
            >
              <VListItem
                v-for="item in filteredSelectedItems"
                :key="item.id"
                class="clickable-text v-list-item"
                @click="removeItem(item)"
              >
                <span>{{ item.name }}</span>
              </VListItem>
            </VList>
            <p
              v-else
              class="text-center"
            >
              No hay {{ props.tipo }} seleccionados.
            </p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped>
.text-center {
  text-align: center;
}
.clickable-text {
  cursor: pointer;
  transition: color 0.3s ease;
  margin: 0px;
  padding: 8px;
}

.clickable-text:hover {
  background-color: var(--button-hover-color);
}

.v-list-item{
  padding: 0px;
}

.scrollable-list {
  max-height: 300px; /* Ajusta según el diseño */
  overflow-y: auto; /* Habilita el desplazamiento vertical */
  border-radius: 8px; /* Opcional: esquinas redondeadas */
  padding: 8px; /* Espaciado interno */
}
</style>
