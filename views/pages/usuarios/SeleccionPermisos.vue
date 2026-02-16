<script setup lang="ts">
import type { SendResponseIndexInterface } from '@/types/sistema/types'

interface PermisoInterface {
  id: number
  name: string
}

interface PropsInterface {
  permisosSeleccionados: PermisoInterface[]
}

const props = defineProps<PropsInterface>()

const emit = defineEmits<{
  (e: 'update:permisosSeleccionados', value: PermisoInterface[]): void
}>()

const { get } = useClienteRequest()

const permisosSeleccionadosActualmente = ref<PermisoInterface[]>([])
const permisosDisponibles = ref<PermisoInterface[]>([])

const getPermisos = async (): Promise<void> => {
  try {
    const res = await get<SendResponseIndexInterface<PermisoInterface[]>>('/api/permisos', {
      params: {
        per_page: 1000,
        'page[size]': -1,
      },
    })

    permisosDisponibles.value = res.data?.data
  }
  catch (error) {
    manejaError(error)
  }
}

const emitirDatos = (): void => {
  emit('update:permisosSeleccionados', permisosSeleccionadosActualmente.value)
}

const filtrarItems = (todos: any[], seleccionados: any[], incluir: boolean) => {
  return todos.filter(item => {
    const existe = seleccionados.some((s: any) => s.id === item.id)
    return incluir ? existe : !existe
  })
}

const permisosSeleccionadosFiltrados = computed(() =>
  filtrarItems(permisosDisponibles.value, permisosSeleccionadosActualmente.value ?? [], true),
)

const permisosDisponiblesFiltrados = computed(() =>
  filtrarItems(permisosDisponibles.value, permisosSeleccionadosActualmente.value ?? [], false),
)

const agregarItem = (seleccionados: any[], destino: any[], item: any) => {
  if (!destino.some((i: any) => i.id === item.id))
    destino.push(item)
  emitirDatos()
}

const quitarItem = (destino: any[], item: any) => {
  const index = destino.findIndex((i: any) => i.id === item.id)
  if (index !== -1)
    destino.splice(index, 1)
  emitirDatos()
}

watch(() => props.permisosSeleccionados, (newVal) => {
  if (newVal) {
    permisosSeleccionadosActualmente.value = newVal
  }
}, { immediate: true })

onMounted(async () => {
  await getPermisos()
})
</script>

<template>
  <VCol cols="12">
    <ListasSeleccionables
      label="name"
      tipo="Permisos"
      :ItemsDisponibles="permisosDisponiblesFiltrados"
      :ItemsSeleccionadas="permisosSeleccionadosFiltrados"
      @item-agregada="item => agregarItem(permisosSeleccionadosFiltrados, permisosSeleccionadosActualmente, item)"
      @item-quitada="item => quitarItem(permisosSeleccionadosActualmente, item)"
    />
  </VCol>
</template>

<style scoped lang="scss">

</style>
