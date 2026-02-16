<script setup lang="ts">
defineProps<{
  headers: any[]
  logs: any[]
  environment: string
  page: number
  itemsPerPage: number
  pagination: any
}>()

defineEmits(['update:page', 'update:itemsPerPage'])

const obtenerNivelColor = (level: string) => {
  const colors: Record<string, string> = {
    error: 'error',
    warning: 'warning',
    notice: 'info',
    info: 'info',
    debug: 'secondary',
  }
  return colors[level?.toLowerCase()] || 'grey'
}

const obtenerIconoNivel = (level: string) => {
  const icons: Record<string, string> = {
    error: 'tabler-alert-triangle',
    warning: 'tabler-alert-circle',
    notice: 'tabler-info-circle',
    info: 'tabler-info-circle',
    debug: 'tabler-bug',
  }
  return icons[level?.toLowerCase()] || 'tabler-file'
}
</script>

<template>
  <VDataTableServer
      :key="`${pagination.total}-${page}-${itemsPerPage}`"
      :headers="headers"
      :items="logs"
      :items-per-page="itemsPerPage"
      :items-length="pagination.total"
      :page="page"
      @update:page="$emit('update:page', $event)"
      @update:items-per-page="$emit('update:itemsPerPage', $event)"
      show-expand
      item-value="datetime"
  >
    <template #item.data-table-expand />
    <!-- DESPLIEGUE DETALLADO -->
    <template
      #item.environment="{ item, internalItem, toggleExpand, isExpanded }"
    >
      <div class="d-inline-flex align-center gap-2">
        <VBtn
          v-if="item.context"
          variant="text"
          size="small"
          class="pa-0"
          icon
          @click="toggleExpand(internalItem)"
        >
          <VIcon
            :icon="isExpanded(internalItem)
              ? 'tabler-chevron-down'
              : 'tabler-chevron-right'"
            size="20"
          />
        </VBtn>
        <div v-else style="width: 32px" />
        {{ environment }}
      </div>
    </template>
    <!-- HORA -->
    <template #item.hora="{ item }">
      <div class="d-flex align-center gap-2">
        <div class="text-truncate" style="max-width: 500px">
          <VTooltip location="top">
            <template #activator="{ props }">
              <span v-bind="props">
                <VIcon icon="tabler-calendar-clock" size="24" />
                {{ formatearFecha(item.datetime) }}
              </span>
            </template>
            <span>{{ item.datetime }}</span>
          </VTooltip>
        </div>
      </div>
    </template>
    <!-- NIVEL DE LOG -->
    <template #item.level="{ item }">
      <VChip
        size="small"
        :color="obtenerNivelColor(item.level)"
        variant="tonal"
        :prepend-icon="obtenerIconoNivel(item.level)"
      >
        {{ item.level }}
      </VChip>
    </template>
    <!-- TITULO DE LOG -->
    <template #item.titulo="{ item }">
      <div class="text-truncate" style="max-width: 500px">
        <VTooltip location="top">
          <template #activator="{ props }">
            <span v-bind="props">{{ item.header }}</span>
          </template>
          <span>{{ item.header }}</span>
        </VTooltip>
      </div>
    </template>
    <!-- CONTENIDO EXPANDIBLE -->
    <template #expanded-row="{ columns, item }">
      <tr v-if="item.context">
        <td :colspan="columns.length" class="pa-0">
          <VCard elevation="0" color="grey-lighten-5" class="ma-4 rounded-lg">
            <VCardText>
              <div class="d-flex gap-3 mb-4 flex-wrap">
                <VChip
                  size="small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="tabler-calendar"
                >
                  {{ item.datetime }}
                </VChip>
                <VChip
                  size="small"
                  :color="
                    item.level === 'error'
                      ? 'error'
                      : item.level === 'warning'
                        ? 'warning'
                        : 'info'
                  "
                  variant="tonal"
                  prepend-icon="tabler-alert-circle"
                >
                  {{ item.level.toUpperCase() }}
                </VChip>
              </div>

              <VDivider class="mb-4" />
              <!-- MENSAJE DE ERROR -->
              <div class="mb-3">
                <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
                  <VIcon icon="tabler-alert-triangle" size="24" color="warning" />
                  Mensaje de Error
                </div>
                <div class="pa-3 rounded" style="background-color:#2d2d2d;color:#ff6b6b;font-family:Consolas,Monaco,monospace;font-size:13px;line-height:1.6;overflow-x:auto;border-left:4px solid #ff6b6b">
                  {{ item.header }}
                </div>
              </div>
              <!-- ARCHIVO -->
              <div class="mb-3">
                <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
                  <VIcon icon="tabler-file-description" size="24" color="gray" />
                  Archivo
                </div>
                <div class="pa-3 rounded" style="background-color:#1e1e1e;color:#00ff00;font-family:Consolas,Monaco,monospace;font-size:13px;overflow-x:auto">
                  {{ item.context?.archivo || 'N/A' }}
                </div>
              </div>
              <!-- USUARIO -->
              <div class="mb-3" v-if="item.context?.usuario">
                <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
                  <VIcon icon="tabler-user-circle" size="24" color="primary" />
                  Usuario
                </div>
                <VCard variant="outlined" class="pa-3">
                  <div class="d-flex align-center gap-3">
                    <VAvatar v-if="item.context.usuario.foto_perfil" :image="item.context.usuario.foto_perfil" size="56"/>
                    <VAvatar v-else color="primary" size="56">
                      <VIcon icon="tabler-user" size="32" />
                    </VAvatar>
                    <div class="flex-grow-1">
                      <div class="font-weight-bold text-body-1">
                        {{
                          item.context.usuario.nombre_completo || "Sin nombre"
                        }}
                      </div>
                      <div class="text-body-2 text-medium-emphasis mt-1">
                        <VIcon icon="tabler-briefcase" size="14" class="me-1"/>
                        {{
                          item.context.usuario.puesto || "Sin puesto"
                        }}
                      </div>
                      <div class="text-caption text-medium-emphasis mt-1" v-if="item.context.usuario.unidad">
                        <VIcon icon="tabler-building" size="14" class="me-1"/>
                        {{ item.context.usuario.unidad }}
                      </div>
                      <div class="d-flex gap-2 mt-2 flex-wrap">
                        <VChip size="x-small" variant="tonal" color="primary" v-if="item.context.usuario.codigo_ejecutivo">
                          <VIcon icon="tabler-id" size="12" class="me-1"/>
                          {{ item.context.usuario.codigo_ejecutivo }}
                        </VChip>
                        <VChip size="x-small" variant="tonal" v-if="item.context.usuario.email">
                          <VIcon icon="tabler-mail" size="12" class="me-1"/>
                          {{ item.context.usuario.email }}
                        </VChip>
                        <VChip size="x-small" variant="tonal" color="success" v-if="item.context.usuario.estado">
                          {{ item.context.usuario.estado }}
                        </VChip>
                      </div>
                      <div class="mt-2" v-if="item.context.usuario.roles && item.context.usuario.roles.length">
                        <VChip v-for="role in item.context.usuario.roles" :key="role" size="x-small" variant="outlined" color="secondary" class="me-1">
                          <VIcon icon="tabler-shield" size="12" class="me-1"/>
                          {{ role }}
                        </VChip>
                      </div>
                    </div>
                  </div>
                </VCard>
              </div>
              <!-- REQUEST DATA -->
              <div v-if="item.context?.request && Object.keys(item.context.request).length">
                <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
                  <VIcon icon="tabler-database-exclamation" size="24" color="gray" />
                  Request Data
                </div>
                <div class="pa-3 rounded" style="background-color:#1e1e1e;color:#d4d4d4;font-family:Consolas,Monaco,monospace;font-size:12px;max-height:300px;overflow-y:auto">
                  <pre style="margin:0;color:#d4d4d4">{{ JSON.stringify(item.context.request, null, 2) }}</pre>
                </div>
              </div>
              <!-- STACK TRACE -->
              <div v-if="item.stack && item.stack.trim()" class="mt-3">
                <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
                  <VIcon icon="tabler-stack" size="24" color="gray" />
                  Stack Trace
                </div>
                <div class="pa-3 rounded" style="background-color:#1e1e1e;color:#ffa500;font-family:Consolas,Monaco,monospace;font-size:11px;max-height:250px;overflow-y:auto;white-space:pre-wrap">
                  {{ item.stack }}
                </div>
              </div>
            </VCardText>
          </VCard>
        </td>
      </tr>
    </template>
  </VDataTableServer>
</template>
