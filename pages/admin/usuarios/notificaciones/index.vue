<script setup lang="ts">

import usuariologo from '@images/avatars/usuario.png'
import type { NotificacionInterface } from '@/types/usuarios/NotificacionesTypes'
import { format } from 'date-fns'
import { useRoute, useRouter } from 'vue-router'
import { useIsMobile } from '@/composables/useIsMobile'

const { isMobile } = useIsMobile()
const route = useRoute();
const router = useRouter();

const notificacionDefault: NotificacionInterface = {
  id: '',
  type: '',
  notifiable_type: '',
  notifiable_id: 0,
  titulo: '',
  data: {
    titulo: '',
    mensaje: '',
  },
  read_at: null,
  created_at: '',
  updated_at: '',
  deleted_at: null
};

const notificacionesNoLeidas = useState<NotificacionInterface[]>('notificacionesNoLeidas')
const totalNotificacionesSinLeerCount = useState<number>('totalNotificacionesSinLeerCount')
const notificacionesLeidas = ref<NotificacionInterface[]>([])
const notificacionSeleccionada = ref<NotificacionInterface>({ ...notificacionDefault })
const refreshNotificaciones = useState<boolean>('refreshNotificaciones')

const isModalOpen = ref(false)
const isGenerarModalOpen = ref(false)
const cantidadLeidas = ref(0)
const cantidadNoLeidas = ref(0)

const { paginaEspera } = useCargandoPagina()
const { showToastError, showToastSuccess } = useToast()
const { get, put, post } = useClienteRequest()

interface NotificacionResponse {
  data: {
    data: NotificacionInterface[],
    next_page_url: string | null,
    total: number
  }
}

const paginaLeidas = ref(1)
const paginaNoLeidas = ref(1)
const totalLeidas = ref(0)
const totalNoLeidas = ref(0)
const limit = 7
const fechaFiltro = ref<string | null>(null)

const dateConfig = {
  mode: 'range',
  locale: { rangeSeparator: ' a ' },
  onClose: (selectedDates: Date[], dateStr: string, instance: any) => {
    if (selectedDates.length === 1) {
      instance.setDate([selectedDates[0], selectedDates[0]], true)
    }
  }
}

const getNotificacionesLeidas = async (page = 1): Promise<void> => {
  try {
    let url = `api/usuarios/notificacions/obtener/leidas?page=${page}&limit=${limit}`

    if (fechaFiltro.value) {
      const dates = fechaFiltro.value.split(' a ')

      if (dates.length > 0) {
        url += `&fecha_inicio=${dates[0]}`

        if (dates.length > 1) {
          url += `&fecha_fin=${dates[1]}`
        } else {
          url += `&fecha_fin=${dates[0]}`
        }
      }
    }

    const response = await get(url) as unknown as NotificacionResponse
    notificacionesLeidas.value = response.data.data ?? []
    totalLeidas.value = response.data.total
    paginaLeidas.value = page
  } catch (error: unknown) {
    if (error instanceof Error) {
      showToastError(error.message)
    } else {
      showToastError('Ocurrió un error inesperado')
    }
  }
}

const getNotificacionesNoLeidas = async (page = 1): Promise<void> => {
  try {
    let url = `api/usuarios/notificacions/obtener/noLeidas?page=${page}&limit=${limit}`

    if (fechaFiltro.value) {
      const dates = fechaFiltro.value.split(' a ')

      if (dates.length > 0) {
        url += `&fecha_inicio=${dates[0]}`

        if (dates.length > 1) {
          url += `&fecha_fin=${dates[1]}`
        } else {
          url += `&fecha_fin=${dates[0]}`
        }
      }
    }

    const response = await get(url) as unknown as NotificacionResponse
    notificacionesNoLeidas.value = response.data.data ?? []
    totalNoLeidas.value = response.data.total
    totalNotificacionesSinLeerCount.value = response.data.total
    paginaNoLeidas.value = page
  } catch (error: unknown) {
    if (error instanceof Error) {
      showToastError(error.message)
    } else {
      showToastError('Ocurrió un error inesperado')
    }
  }
}

getNotificacionesLeidas()
getNotificacionesNoLeidas()

const marcarComoLeida = async (): Promise<void> => {
  interface ResponseInterface {
    message: string
  }

  try {
    paginaEspera.value = true

    if (!notificacionSeleccionada.value.id) return

    const res = await put(`api/usuarios/notificacions/marcar/leida/${notificacionSeleccionada.value.id}`, {}) as unknown as ResponseInterface

    // Actualizar listas después de marcar como leída
    getNotificacionesNoLeidas(paginaNoLeidas.value)
    getNotificacionesLeidas(paginaLeidas.value)

    notificacionSeleccionada.value = { ...notificacionDefault }

    showToastSuccess(res.message)
  } catch (error: unknown) {
    if (error instanceof Error) {
      showToastError(error.message)
    } else {
      showToastError('Ocurrió un error inesperado')
    }
  } finally {
    paginaEspera.value = false
  }
}

const generarNotificaciones = async (): Promise<void> => {
  try {
    paginaEspera.value = true
    await post('api/usuarios/notificacions/generar/prueba', {
      leidas: cantidadLeidas.value,
      no_leidas: cantidadNoLeidas.value
    })

    showToastSuccess('Notificaciones generadas correctamente')
    isGenerarModalOpen.value = false
    cantidadLeidas.value = 0
    cantidadNoLeidas.value = 0

    // Recargar listas
    getNotificacionesNoLeidas(1)
    getNotificacionesLeidas(1)
  } catch (error: unknown) {
    if (error instanceof Error) {
      showToastError(error.message)
    } else {
      showToastError('Ocurrió un error inesperado')
    }
  } finally {
    paginaEspera.value = false
  }
}

const cerrarModal = (): void => {
  if (notificacionSeleccionada.value.read_at === null) {
    marcarComoLeida()
  }

  isModalOpen.value = false
}

if (route.query?.id) {
  const notificacionId = route.query.id as string
  const notificacion = notificacionesNoLeidas.value.find(n => n.id === notificacionId)

  if (notificacion) {
    notificacionSeleccionada.value = { ...notificacion }
    isModalOpen.value = true
  }
}

const seleccionarNotificacion = (notificacion: NotificacionInterface): void => {
  notificacionSeleccionada.value = { ...notificacion }
  isModalOpen.value = true
}

//LOGICA MOVIL
const notificacionesMobile = computed<NotificacionInterface[]>(() => {
  return [
    ...notificacionesNoLeidas.value,
    ...notificacionesLeidas.value,
  ].sort((a, b) =>
    new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )
})
const swipeX = ref<Record<string, number>>({})
const swiping = ref<Record<string, boolean>>({})
let startX = 0

const onTouchStart = (e: TouchEvent, id: string) => {
  startX = e.touches[0].clientX
  swiping.value[id] = true
}

const onTouchMove = (e: TouchEvent, id: string) => {
  if (!swiping.value[id]) return

  const currentX = e.touches[0].clientX
  const diff = currentX - startX

  // solo swipe a la derecha
  if (diff > 0) {
    swipeX.value[id] = diff
  }
}

const onTouchEnd = async (id: string, notificacion: NotificacionInterface) => {
  swiping.value[id] = false

  if ((swipeX.value[id] ?? 0) > 90) {
    swipeX.value[id] = 120

    // ✅ SOLO MOBILE
    await marcarComoLeidaMobile(notificacion)
  }

  setTimeout(() => {
    swipeX.value[id] = 0
  }, 200)
}
const marcarComoLeidaMobile = async (notificacion: NotificacionInterface) => {
  try {
    if (notificacion.read_at) return

    notificacionSeleccionada.value = { ...notificacion }
    await put(`api/usuarios/notificacions/marcar/leida/${notificacion.id}`, {})

    // 🔹 SOLO ACTUALIZAMOS EL ESTADO
    notificacion.read_at = new Date().toISOString()

    // Actualizar contador global si es necesario (opcional, pero recomendable para consistencia)
    if (totalNotificacionesSinLeerCount.value > 0) {
      totalNotificacionesSinLeerCount.value--
    }

  } catch (error) {
    showToastError('Error al marcar como leída')
  }
}

watch(() => route.query.id, (id) => {
  if (id) {
    const notificacionId = id as string
    const notificacion = notificacionesNoLeidas.value.find(n => n.id === notificacionId)

    console.log('cambio')
    if (notificacion) {
      notificacionSeleccionada.value = { ...notificacion }
      isModalOpen.value = true
    }
  }
})

watch(refreshNotificaciones, () => {
  getNotificacionesLeidas(1)
  getNotificacionesNoLeidas(1)
})

watch(fechaFiltro, () => {
  getNotificacionesLeidas(1)
  getNotificacionesNoLeidas(1)
})

// Sincronizar contador local con global para reactividad en tiempo real
watch(totalNotificacionesSinLeerCount, (newVal) => {
  totalNoLeidas.value = newVal
})

</script>

<template >
  <div v-if="!isMobile">
    <div class="d-flex flex-wrap justify-end justify-sm-space-between mb-6">
      <VBtn
        icon="tabler-arrow-narrow-left"
        v-tooltip="'Regresar'"
        variant="text"
        color="primary"
        class="ml-2 mr-4"
        size="large"
        :to="'/'"
      />
      <h1>Bandeja de Notificaciones</h1>
      <div class="ms-auto d-flex gap-2">
        <VBtn
          color="secondary"
          @click="isGenerarModalOpen = true"
        >
          <VIcon icon="tabler-plus" class="mr-2" />
          Generar Prueba
        </VBtn>
        <VBtn
          style="inline-size: 18rem;"
          @click="router.go(-1)"
        >
          <VIcon
            icon="tabler-arrow-left"
            class="mr-2"
          />
          Regresar
        </VBtn>
      </div>
    </div>

    <VRow class="mb-1">
      <VCol cols="12" md="4">
        <AppDateTimePicker
          v-model="fechaFiltro"
          placeholder="Filtrar por fecha"
          :config="dateConfig"
          clearable
          prepend-inner-icon="tabler-calendar"
        />
      </VCol>
    </VRow>

    <VRow>

      <VCol cols="6">

        <VCard>
          <VCardItem>
            <VCardTitle>
              📩 No Leídas
              <VChip
                class="ms-2"
                color="primary"
                size="small"
              >
                {{ totalNotificacionesSinLeerCount }}
              </VChip>
            </VCardTitle>
          </VCardItem>

          <VList>

            <VListItem
              v-for="notificacion in notificacionesNoLeidas"
              :key="notificacion.id"
              link
              @click="seleccionarNotificacion(notificacion)"
            >
              <template #prepend>
                <VAvatar>
                  <VImg :src="usuariologo"/>
                </VAvatar>
              </template>
              <VListItemTitle>{{ notificacion.data.titulo }}</VListItemTitle>
              <VListItemSubtitle>{{ notificacion.data.mensaje }}</VListItemSubtitle>
            </VListItem>

          </VList>
          <div class="d-flex justify-center pa-4">
            <VPagination
              v-if="totalNoLeidas > limit"
              v-model="paginaNoLeidas"
              :length="Math.ceil(totalNoLeidas / limit)"
              :total-visible="5"
              @update:model-value="getNotificacionesNoLeidas"
            />
          </div>

        </VCard>

      </VCol>

      <VCol cols="6">
        <VCard>
          <VCardItem>
            <VCardTitle>
              📨 Leídas
              <VChip
                class="ms-2"
                color="primary"
                size="small"
              >
                {{ totalLeidas }}
              </VChip>
            </VCardTitle>
          </VCardItem>

          <VList>
            <VListItem
              v-for="notificacion in notificacionesLeidas"
              :key="notificacion.id"
              link
              @click="seleccionarNotificacion(notificacion)"
            >
              <template #prepend>
                <VAvatar>
                  <VImg :src="usuariologo"/>
                </VAvatar>
              </template>
              <VListItemTitle>{{ notificacion.data.titulo }}</VListItemTitle>
              <VListItemSubtitle>{{ notificacion.data.mensaje }}</VListItemSubtitle>
            </VListItem>
          </VList>
          <div class="d-flex justify-center pa-4">
            <VPagination
              v-if="totalLeidas > limit"
              v-model="paginaLeidas"
              :length="Math.ceil(totalLeidas / limit)"
              :total-visible="5"
              @update:model-value="getNotificacionesLeidas"
            />
          </div>
        </VCard>
      </VCol>

    </VRow>

    <VDialog
      v-model="isModalOpen"
      max-width="500px"
      @click:outside="cerrarModal"
    >
      <VCard>
        <VCardTitle>{{ notificacionSeleccionada.data.titulo }}</VCardTitle>
        <VCardText>
          <VImg
            :src="usuariologo"
            width="40"
          />
          <p>{{ notificacionSeleccionada.data.mensaje }}</p>
          <p class="text-muted">
            Fecha: {{ format(new Date(notificacionSeleccionada.created_at ?? new Date()), 'dd-MM-yyyy HH:mm:ss') }}
          </p>
        </VCardText>
        <VCardActions>
          <VBtn
            color="primary"
            @click="cerrarModal"
          >
            Cerrar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Modal para generar notificaciones de prueba -->
    <VDialog
      v-model="isGenerarModalOpen"
      max-width="400px"
    >
      <VCard title="Generar Notificaciones de Prueba">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model.number="cantidadNoLeidas"
                label="Cantidad No Leídas"
                type="number"
                min="0"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model.number="cantidadLeidas"
                label="Cantidad Leídas"
                type="number"
                min="0"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="secondary"
            variant="text"
            @click="isGenerarModalOpen = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            @click="generarNotificaciones"
          >
            Generar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>

  <div v-else class="mobile-notificaciones">
    <div class="px-3 pt-2">
      <AppDateTimePicker
        v-model="fechaFiltro"
        placeholder="Filtrar por fecha"
        :config="dateConfig"
        clearable
        prepend-inner-icon="tabler-calendar"
        density="compact"
      />
    </div>

    <h3 class="mobile-title">Notificaciones</h3>

    <div
      v-for="notificacion in notificacionesMobile"
      :key="notificacion.id"
      class="swipe-container"
    >
      <!-- Fondo (acción) -->
      <div
        v-if="!notificacion.read_at"
        class="swipe-background"
      >
        <VIcon icon="tabler-check" size="20" />
        <span>Marcar como leído</span>
      </div>

      <!-- Notificación -->
      <div
        class="mobile-notificacion swipe-item"
        :class="{ 'no-swipe': notificacion.read_at }"
        :style="!notificacion.read_at
    ? { transform: `translateX(${swipeX[notificacion.id] || 0}px)` }
    : {}"
        @touchstart="!notificacion.read_at && onTouchStart($event, notificacion.id)"
        @touchmove="!notificacion.read_at && onTouchMove($event, notificacion.id)"
        @touchend="!notificacion.read_at && onTouchEnd(notificacion.id, notificacion)"
      >

        <div class="avatar">
          <img :src="usuariologo" />
        </div>

        <div class="contenido">
          <div class="titulo">
            {{ notificacion.data.titulo }}
          </div>
          <div class="mensaje">
            {{ notificacion.data.mensaje }}
          </div>
        </div>

        <div class="estado">
      <span class="hora">
        {{ format(new Date(notificacion.created_at ?? new Date()), 'HH:mm') }}
      </span>
          <span
            v-if="!notificacion.read_at"
            class="punto-no-leido"
          />
        </div>

      </div>
    </div>


  </div>
</template>

<style lang="scss" scoped>
.mobile-notificaciones {
  padding: 8px 0;
}

.mobile-title {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}

.mobile-notificacion {
  display: flex;
  align-items: center;
  padding: 8px 12px; // ⬅️ antes 12px 16px
  cursor: pointer;
  border-radius: 0;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

.mobile-notificacion:active {
  background: #f3f4f6;
}

.avatar img {
  width: 36px; // ⬅️ antes 40
  height: 36px;
  border-radius: 50%;
}

.contenido {
  flex: 1;
  margin-left: 10px; // ⬅️ antes 12
}

.titulo {
  font-weight: 600;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}

.mensaje {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-top: 2px;
}

.estado {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.hora {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.punto-no-leido {
  width: 8px;
  height: 8px;
  background: #0565ff;
  border-radius: 50%;
}
.swipe-container {
  position: relative;
  overflow: hidden;
  margin: 4px 12px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.swipe-background {
  position: absolute;
  inset: 0;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 16px;
  font-size: 13px;
}

.swipe-item {
  position: relative;
  z-index: 1;
  transition: transform 0.2s ease;

  touch-action: pan-y;
}
.no-swipe {
  touch-action: pan-y;
}
</style>
