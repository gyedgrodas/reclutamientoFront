<script setup lang="ts">
import type { DatosUsuario, OpcionAcceso, UsuarioGestion } from '@/types/usuarios/gestion'
import type { SendResponseIndexInterface } from '@/types/sistema/types'
import { emailValidator, requiredValidator } from '@core/utils/validators'

const props = defineProps<{ usuario?: UsuarioGestion; guardando: boolean }>()
const emit = defineEmits<{ (e: 'guardar', datos: DatosUsuario): void }>()
const { get } = useClienteRequest()
const usuarioActual = useSanctumUser<{ id: number; roles: string[] }>()

const esAdmin = computed(() => {
  const roles = usuarioActual.value?.roles || []

  return roles.includes('admin') || roles.includes('SuperAdministrador') || roles.includes('Super Administrador')
})

const puedeCambiarPassword = computed(() => !props.usuario || esAdmin.value || usuarioActual.value?.id === props.usuario.id)
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const datos = reactive({
  usuario_dominio: props.usuario?.usuario_dominio || '',
  nombres: props.usuario?.nombres || '',
  apellidos: props.usuario?.apellidos || '',
  correo: props.usuario?.correo || '',
  estado: props.usuario?.estado || 'activo',
  password: '',
  roles: props.usuario?.roles?.map(rol => rol.id) || [],
  permissions: props.usuario?.permissions?.map(permiso => permiso.id) || [],
})

const roles = ref<OpcionAcceso[]>([])
const permisos = ref<OpcionAcceso[]>([])
const catalogosListos = ref(false)
const cargandoCatalogos = ref(false)

const cargarCatalogo = async (endpoint: string): Promise<OpcionAcceso[]> => {
  const items: OpcionAcceso[] = []
  let page = 1
  let lastPage = 1
  do {
    const respuesta = await get<SendResponseIndexInterface<OpcionAcceso[]>>(endpoint, {
      params: { 'page[number]': page, 'page[size]': 30, 'filter[guard_name]': 'api' },
    })

    items.push(...respuesta.data.data)
    lastPage = respuesta.data.last_page
    page++
  } while (page <= lastPage)

  return items
}

const cargarCatalogos = async () => {
  cargandoCatalogos.value = true
  catalogosListos.value = false
  try {
    const [rolesDisponibles, permisosDisponibles] = await Promise.all([
      cargarCatalogo('/api/roles'), cargarCatalogo('/api/permisos'),
    ])

    roles.value = rolesDisponibles
    permisos.value = permisosDisponibles
    catalogosListos.value = true
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargandoCatalogos.value = false
  }
}

watch(esAdmin, admin => {
  if (admin && !catalogosListos.value && !cargandoCatalogos.value)
    cargarCatalogos()
}, { immediate: true })

const guardar = async () => {
  if (!(await form.value?.validate())?.valid || (esAdmin.value && !catalogosListos.value))
    return

  const payload: DatosUsuario = {
    usuario_dominio: datos.usuario_dominio,
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    correo: datos.correo,
    estado: datos.estado,
  }

  if (datos.password)
    payload.password = datos.password
  if (esAdmin.value) {
    payload.roles = datos.roles
    payload.permissions = datos.permissions
  }
  emit('guardar', payload)
}
</script>

<template>
  <VForm ref="form" @submit.prevent="guardar">
    <VRow>
      <VCol cols="12" md="6"><AppTextField v-model="datos.usuario_dominio" label="Usuario" maxlength="191" :rules="[requiredValidator]" /></VCol>
      <VCol cols="12" md="6"><AppTextField v-model="datos.correo" label="Correo" type="email" maxlength="190" :rules="[requiredValidator, emailValidator]" /></VCol>
      <VCol cols="12" md="6"><AppTextField v-model="datos.nombres" label="Nombres" maxlength="100" :rules="[requiredValidator]" /></VCol>
      <VCol cols="12" md="6"><AppTextField v-model="datos.apellidos" label="Apellidos" maxlength="100" :rules="[requiredValidator]" /></VCol>
      <VCol cols="12" md="6">
        <AppSelect v-model="datos.estado" label="Estado" :items="[{ title: 'Activo', value: 'activo' }, { title: 'Inactivo', value: 'inactivo' }]" :rules="[requiredValidator]" />
      </VCol>
      <VCol v-if="puedeCambiarPassword" cols="12" md="6">
        <AppTextField v-model="datos.password" :label="usuario ? 'Nueva contraseña (opcional)' : 'Contraseña'" type="password" maxlength="255" :rules="usuario ? [] : [requiredValidator]" autocomplete="new-password" />
      </VCol>
      <template v-if="esAdmin">
        <VCol cols="12" md="6"><AppAutocomplete v-model="datos.roles" label="Roles" :items="roles" item-title="name" item-value="id" multiple chips :loading="cargandoCatalogos" /></VCol>
        <VCol cols="12" md="6"><AppAutocomplete v-model="datos.permissions" label="Permisos directos" :items="permisos" item-title="name" item-value="id" multiple chips :loading="cargandoCatalogos" /></VCol>
        <VCol v-if="!catalogosListos && !cargandoCatalogos" cols="12">
          <VAlert type="error" variant="tonal">No fue posible cargar los roles y permisos. <VBtn variant="text" @click="cargarCatalogos">Reintentar</VBtn></VAlert>
        </VCol>
      </template>
      <VCol cols="12" class="d-flex gap-2">
        <VBtn type="submit" :loading="guardando" :disabled="guardando || (esAdmin && !catalogosListos)">Guardar</VBtn>
        <VBtn color="secondary" variant="tonal" to="/admin/usuarios">Cancelar</VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>
