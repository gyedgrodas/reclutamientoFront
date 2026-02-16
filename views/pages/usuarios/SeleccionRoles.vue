<script setup lang="ts">
import type { SendResponseIndexInterface } from '@/types/sistema/types'
import type { RolInterface } from '@/types/usuarios'

interface PropsInterface {
  rolesSeleccionados: RolInterface[]
}

const props = defineProps<PropsInterface>()

const emit = defineEmits<{
  (e: 'update:rolesSeleccionados', value: RolInterface[]): void
}>()

const { get } = useClienteRequest()

const rolesSeleccionadosActualmente = ref<RolInterface[]>([])
const rolesDisponibles = ref<RolInterface[]>([])

const getRoles = async (): Promise<void> => {
  try {
    const res = await get<SendResponseIndexInterface<RolInterface[]>>('api/roles', {
      params: {
        per_page: 1000,
        'page[size]': -1,
      },
    })

    rolesDisponibles.value = res.data?.data
  }
  catch (error) {
    manejaError(error)
  }
}

const emitirDatos = (): void => {
  emit('update:rolesSeleccionados', rolesSeleccionadosActualmente.value)
}

const filtrarItems = (todos: any[], seleccionados: any[], incluir: boolean) => {
  return todos.filter(item => {
    const existe = seleccionados.some((s: any) => s.id === item.id)
    return incluir ? existe : !existe
  })
}

const rolesSeleccionadosFiltrados = computed(() =>
  filtrarItems(rolesDisponibles.value, rolesSeleccionadosActualmente.value ?? [], true),
)

const rolesDisponiblesFiltrados = computed(() =>
  filtrarItems(rolesDisponibles.value, rolesSeleccionadosActualmente.value ?? [], false),
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

watch(() => props.rolesSeleccionados, (newVal) => {
  if (newVal) {
    rolesSeleccionadosActualmente.value = newVal
  }
}, { immediate: true })

onMounted(async () => {
  await getRoles()
})
</script>

<template>
  <VCol cols="12">
    <ListasSeleccionables
      label="name"
      tipo="Roles"
      :ItemsDisponibles="rolesDisponiblesFiltrados"
      :ItemsSeleccionadas="rolesSeleccionadosFiltrados"
      @item-agregada="item => agregarItem(rolesSeleccionadosFiltrados, rolesSeleccionadosActualmente, item)"
      @item-quitada="item => quitarItem(rolesSeleccionadosActualmente, item)"
    />
  </VCol>
</template>

<style scoped lang="scss">

</style>
