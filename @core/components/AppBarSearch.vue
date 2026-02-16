<script setup lang="ts" generic="T extends unknown">
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { VList, VListItem } from 'vuetify/components/VList'
import { can } from '@layouts/plugins/casl'
import { onMounted, onBeforeUnmount, nextTick } from 'vue'

interface Emit {
  (e: 'update:isNavegacionVisible', value: boolean): void
  (e: 'search', value: string): void
  (e: 'redirect', value: Suggestion): void
}

interface Suggestion {
  icon: string
  title: string
  url: { name: string }
  action?: string
  subject?: string
}

interface Props {
  isNavegacionVisible: boolean
  searchResults: { title: string; content: Suggestion[] }[]
  isLoading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const searchQueryLocal = ref('')
const activeIndex = ref(-1)
const contenedorScroll = ref<HTMLElement>()

const allFlatResults = computed(() =>
  props.searchResults.flatMap(group => group.content)
)

const getFocusOnSearchList = (e: KeyboardEvent) => {
  const total = allFlatResults.value.length

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % total
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + total) % total
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    const selected = allFlatResults.value[activeIndex.value]
    if (selected) emit('redirect', selected)
  }
}

watch(activeIndex, () => {
  nextTick(() => {
    const elementos = contenedorScroll.value?.querySelectorAll('.app-bar-search-suggestion') || []
    const activo = elementos[activeIndex.value] as HTMLElement
    if (activo) activo.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
})

const clearSearchAndCloseDialog = () => {
  searchQueryLocal.value = ''
  emit('update:isNavegacionVisible', false)
}

watch(
  () => props.isNavegacionVisible,
  () => {
    searchQueryLocal.value = ''
    activeIndex.value = -1
  }
)

watch(searchQueryLocal, () => {
  activeIndex.value = -1
  emit('search', searchQueryLocal.value)
})

const manejarEscapeGlobal = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isNavegacionVisible) {
    e.preventDefault()
    clearSearchAndCloseDialog()
  }
}

const manejarAtajoGlobal = (e: KeyboardEvent) => {
  const esCtrlK = e.ctrlKey && e.key.toLowerCase() === 'k'
  const esMetaK = e.metaKey && e.key.toLowerCase() === 'k'

  if (esCtrlK || esMetaK) {
    e.preventDefault()
    e.stopPropagation()

    emit('update:isNavegacionVisible', true)
  }
}

onMounted(() => {
  window.addEventListener('keydown', manejarAtajoGlobal)
  window.addEventListener('keydown', manejarEscapeGlobal)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', manejarAtajoGlobal)
  window.removeEventListener('keydown', manejarEscapeGlobal)
})
</script>

<template>
  <VDialog
    max-width="600"
    :model-value="props.isNavegacionVisible"
    class="app-bar-search-dialog"
    @update:model-value="val => emit('update:isNavegacionVisible', val)"
  >
    <VCard class="search-modal-card">
      <VCardText>
        <VTextField
          v-model="searchQueryLocal"
          autofocus
          variant="plain"
          density="compact"
          @keydown="getFocusOnSearchList"
        >
          <template #prepend-inner>
            <VIcon icon="tabler-search" />
          </template>
          <template #append-inner>
            <VIcon icon="tabler-x" @click="clearSearchAndCloseDialog" />
          </template>
        </VTextField>
      </VCardText>

      <VDivider />

      <PerfectScrollbar ref="contenedorScroll">
        <template v-if="!props.isLoading">
          <VList class="app-bar-search-list">
            <template
              v-for="(group, groupIndex) in props.searchResults"
              :key="group.title"
            >
              <p class="text-disabled text-uppercase px-4 pt-4 pb-1">
                {{ group.title }}
              </p>
              <VListItem
                v-for="(item, itemIndex) in group.content"
                :key="item.title"
                :class="[
                  'app-bar-search-suggestion',
                  activeIndex === allFlatResults.indexOf(item) ? 'active' : ''
                ]"
                @click="$emit('redirect', item)"
                tabindex="0"
              >
                <template #prepend>
                  <VIcon :icon="item.icon" size="20" class="me-n1" />
                </template>
                <VListItemTitle>{{ item.title }}</VListItemTitle>
              </VListItem>
            </template>
          </VList>
        </template>

        <template v-if="props.isLoading">
          <VSkeletonLoader type="list-item-two-line" />
        </template>

        <template v-if="searchQueryLocal && !props.searchResults.length && !props.isLoading">
          <slot name="noData">
            <VCardText class="h-100">
              <div class="app-bar-search-suggestions d-flex flex-column align-center justify-center text-high-emphasis pa-12">
                <VIcon
                  size="64"
                  icon="tabler-file-alert"
                />
                <div class="d-flex align-center flex-wrap justify-center gap-2 text-h5 mt-3">
                  <span>No hay resultados</span>
                </div>

                <slot name="noDataSuggestion" />
              </div>
            </VCardText>
          </slot>
        </template>
      </PerfectScrollbar>
    </VCard>
  </VDialog>
</template>

<style lang="scss" scoped>
.app-bar-search-suggestion.active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
.search-modal-card {
  max-height: 600px;
  display: flex;
  flex-direction: column;
}
</style>
