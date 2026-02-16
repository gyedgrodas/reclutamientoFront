<script lang="ts" setup>

import type { Notification } from '@layouts/types'
import type { UsuarioInterface } from '@/types/usuarios/index.ts'
import type { NotificacionInterface } from '@/types/usuarios/NotificacionesTypes'
import {PerfectScrollbar} from "vue3-perfect-scrollbar";

const { post, get } = useClienteRequest()
const { showToastError, showToastInfo } = useToast()

const notificacionesNoLeidas = useState<NotificacionInterface[]>('notificacionesNoLeidas', () => [])
const totalNotificacionesSinLeerCount = useState<number>('totalNotificacionesSinLeerCount', () => 0)
const refreshNotificaciones = useState<boolean>('refreshNotificaciones', () => false)

const getNotificaciones = async () => {

  try {

    const response: {data: { data: NotificacionInterface[], total: number } } = await get('api/usuarios/notificacions/obtener/noLeidas')

    notificacionesNoLeidas.value = response.data.data
    totalNotificacionesSinLeerCount.value = response.data.total

  }
  catch (error) {

    const errorMessage = (error as Error)?.message ?? 'Ocurrió un error inesperado';

    showToastError(errorMessage);

  }

}

getNotificaciones()

const leerTodo = async () => {
  try {
    await post('api/usuarios/notificacions/marcarleidoTodos', {})

    notificacionesNoLeidas.value = []
    totalNotificacionesSinLeerCount.value = 0
    refreshNotificaciones.value = !refreshNotificaciones.value

    showToastInfo('Todas las notificaciones se han marcado como leídas')

  } catch (error) {
    const errorMessage = (error as Error)?.message ?? 'Ocurrió un error inesperado';
    showToastError(errorMessage);
  }
}

const estaTodoMarcadoComoLeido = computed(() => {
  return notificacionesNoLeidas.value.some((item: NotificacionInterface) => item.read_at === null)
})

const user = useSanctumUser<UsuarioInterface>()

const { $echo } = useNuxtApp()

onMounted(() => {

  $echo.channel('notificaciones.' + user?.value?.id)

    .listen('.mostrar.notificacion.usuario',  (data: NotificacionInterface)=> {

      showToastInfo(data.data.titulo)

      notificacionesNoLeidas.value.push(data)
      totalNotificacionesSinLeerCount.value++
      refreshNotificaciones.value = !refreshNotificaciones.value

    })
    .error((error: unknown) => {

      console.error('Error en WebSocket:', error)

    })
})
</script>

<template>

  <IconBtn
    v-if="notificacionesNoLeidas"
    id="notification-btn"
  >
    <VBadge
      :model-value="totalNotificacionesSinLeerCount > 0"
      color="error"
      dot
      offset-x="2"
      offset-y="3"
    >
      <VIcon icon="tabler-bell" />
    </VBadge>

    <VMenu
      activator="parent"
      width="380px"
      location="bottom end"
      offset="12px"
      :close-on-content-click="true"
    >
      <VCard class="d-flex flex-column">
        <!-- 👉 Header -->
        <VCardItem class="notification-section">
          <VCardTitle class="text-h6">
            Notificaciones
          </VCardTitle>

          <template #append>
            <VChip
              v-show="totalNotificacionesSinLeerCount > 0"
              size="small"
              color="primary"
              class="me-2"
            >
              {{ totalNotificacionesSinLeerCount }} Nuevos
            </VChip>
            <IconBtn
              v-show="notificacionesNoLeidas.length"
              size="34"
              @click="leerTodo"
            >
              <VIcon
                size="20"
                color="high-emphasis"
                :icon="!estaTodoMarcadoComoLeido ? 'tabler-mail' : 'tabler-mail-opened' "
              />

              <VTooltip
                activator="parent"
                location="start"
              >
                {{ !estaTodoMarcadoComoLeido ? 'Marcar todo como no leído' : 'Marcar todo como leído' }}
              </VTooltip>
            </IconBtn>
          </template>
        </VCardItem>

        <VDivider />

        <!-- 👉 Notifications list -->
        <PerfectScrollbar
          :options="{ wheelPropagation: false }"
          style="max-block-size: 23.75rem;"
        >
          <VList class="notification-list rounded-0 py-0">

            <NavBarNotificationItem
              v-if="notificacionesNoLeidas.length"
              v-for="notificacion in notificacionesNoLeidas"
              :key="notificacion.id"
              :notificacion="notificacion"
            />

            <VListItem
              v-else
              class="text-center text-medium-emphasis"
              style="block-size: 56px;"
            >
              <VListItemTitle> No hay notificaciones </VListItemTitle>
            </VListItem>

          </VList>
        </PerfectScrollbar>

        <VDivider />

        <!-- 👉 Footer -->
        <VCardText
          class="pa-4"
        >
          <VBtn
            block
            size="small"
            to="/admin/usuarios/notificaciones"
          >
            Ver todas las notificaciones
          </VBtn>
        </VCardText>
      </VCard>
    </VMenu>
  </IconBtn>

</template>
