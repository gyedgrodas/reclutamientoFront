<script setup lang="ts">
import { ref } from 'vue'
import { can } from '@layouts/plugins/casl'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes'
import type DataTable from '@/components/form-elements/DataTableComponent.vue'
import { MODEL_TYPE_USER } from '@/constantes/ModelTypes'

definePageMeta({
  navActiveLink: 'usuarios',
  middleware: 'permissions',
  action: 'listar usuarios',
  subject: 'User',
})

const { put, post, deleted } = useClienteRequest()
const { showToastSuccess, showToastError, preguntaEliminar, realizarPregunta } = useToast()
const { paginaEspera } = useCargandoPagina()
const { refreshIdentity } = useSanctumAuth();

const estados = ref([
  { id: "Activo", nombre: "Activo" },
  { id: "Inactivo", nombre: "Inactivo" },
  { id: "Cancelado", nombre: "Cancelado" },
]);
const dataTable = ref<InstanceType<typeof DataTable> | null>(null)

const filtros = ref({
  user_id: null,
  codigo_cliente_unico: null,
  usuario_dominio: null,
  region_id: null,
  unidad_id: null,
  puesto_id: null,
  roles_id: null,
  estado_id: null,
});

const password = ref("")

const columnas = computed<ColumnaInterface[]>(() => ([
  {
    title: 'ID',
    key: 'id',
    exportable: true
  },
  {
    title: 'Nombre',
    key: 'nombre_completo',
    exportable: true,
    sortable: false,
    OpcionesFiltro: {
      campo: 'id',
      operador: '=',
      valor: filtros.value.user_id,
    },
  },
  {
    title: 'Usuario Dominio',
    key: 'usuario_dominio',
    exportable: true,
    OpcionesFiltro: {
      campo: 'usuario_dominio',
      operador: 'LIKE',
      valor: filtros.value.usuario_dominio,
    },
  },
  {
    title: 'Email',
    key: 'email',
    exportable: true,
    sortable: false,
  },
  {
    title: 'fecha de creacion',
    key: 'created_at',
    exportable: true,
    sortable: false,
  },
  {
    title: 'Acciones',
    key: 'Acciones',
    sortable: false,
    exportable: false
  },
  {
    title: 'asociado.codigo_cliente_unico',
    key: 'asociado.codigo_cliente_unico',
    sortable: false,
    exportable: false,
    visible: false,
    OpcionesFiltro: {
      campo: 'asociado.codigo_cliente_unico',
      operador: '=',
      valor: filtros.value.codigo_cliente_unico,
    },
  },
  {
    title: 'region_id',
    key: 'region_id',
    sortable: false,
    exportable: false,
    visible: false,
    OpcionesFiltro: {
      campo: 'region_id',
      operador: '=',
      valor: filtros.value.region_id,
    },
  },
  {
    title: 'unidad_id',
    key: 'unidad_id',
    sortable: false,
    exportable: false,
    visible: false,
    OpcionesFiltro: {
      campo: 'unidad_id',
      operador: '=',
      valor: filtros.value.unidad_id,
    },
  },
  {
    title: 'puesto_id',
    key: 'puesto_id',
    sortable: false,
    exportable: false,
    visible: false,
    OpcionesFiltro: {
      campo: 'puesto_id',
      operador: '=',
      valor: filtros.value.puesto_id,
    },
  },
  {
    title: 'roles.id',
    key: 'roles.id',
    sortable: false,
    exportable: false,
    visible: false,
    OpcionesFiltro: {
      campo: 'roles.id',
      operador: '=',
      valor: filtros.value.roles_id,
    },
  },
  {
    title: 'estado',
    key: 'estado',
    sortable: false,
    exportable: false,
    visible: false,
    OpcionesFiltro: {
      campo: 'estado',
      operador: '=',
      valor: filtros.value.estado_id,
    },
  },
]))

const filtrar = (): void => {
  dataTable.value?.getItems()
}

const limpiarFiltros = (): void => {
  filtros.value = {
    region_id: null,
    unidad_id: null,
    user_id: null,
    codigo_cliente_unico: null,
    usuario_dominio: null,
    roles_id: null,
    estado_id: null,
    puesto_id: null,
  }
  setTimeout(() => {
    dataTable.value?.getItems()
  }, 1000);
}


const deleteItem = async (id: number) => {
  const confirm = await preguntaEliminar('¿Desea Eliminar Usuario?')

  if (!confirm)
    return

  try {
    const respuesta = await deleted(`/api/users/${id}`)

    showToastSuccess(respuesta.message)

    // allUsers.value = [...allUsers.value] // Esto garantiza que la tabla se actualice.
  }
  catch (error) {
    showToastError(error.message)
  }
}
const resetPassword = async (id: number) => {
  const confirm = await realizarPregunta({
    titulo: "¿Desea restablecer la contraseña?",
    message: "Se restablecerá la contraseña del usuario",
    texto_btn_confirmar: "Sí",
    texto_btn_cancelar: "No",
  });
  if (!confirm) return;

  try {
    const respuesta = await put(`api/usuarios/restablecer/contrasena/${id}`, {
      password: password.value,
    });

    showToastSuccess(respuesta?.message);
  } catch (error) {
    mostrarError(error);
  }
};

const iniciarOtroUsuario = async (id: number) => {
  const confirm = await realizarPregunta({
    titulo: "¿Iniciar sesión con otro usuario?",
    message:
      "Se iniciará sesión con otro usuario y se cerrará la sesión actual",
    texto_btn_confirmar: "Sí",
    texto_btn_cancelar: "No",
  });

  if (!confirm) return;
  paginaEspera.value = true;

  try {
    const respuesta: any = await put(`/api/usuarios/devLoginAsUser`, {
      user_id: id,
    });
    const res = await post("api/auth/logout", {});

    const cookie = useCookie<string>("sanctum.token.cookie");

    cookie.value = respuesta.token;

    await refreshIdentity();

    navigateTo("/");
  } catch (error) {
    console.log(error);

    mostrarError(error);
  } finally {
    paginaEspera.value = false;
  }
};

const filtrosUnidad = computed(() => {
  if (!filtros.value.region_id)
    return null

  return {
    regiones_id: filtros.value.region_id,
  }
})

watch(() => filtros.value.region_id, () => {
  filtros.value.unidad_id = null
})

</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between mb-6">
    <h1>Gestión de Usuarios</h1>
    <span
      v-tooltip="{
        location: 'start',
        text: 'La creación de usuarios se realiza desde el portal SIGUA',
      }"
    >
    <VBtn
      v-if="can('crear usuarios', 'usuarios')"
      class="ms-auto"
      style="inline-size: 18rem;"
      prepend-icon="tabler-plus"
      to="/admin/usuarios/create"
      :disabled="true"
    >
      Nuevo Usuario
    </VBtn>
    </span>
  </div>
  <VCard class="mb-2">
    <VCardText class="mb-4">
      <VRow class="d-flex flex-wrap">
        <VCol
          cols="12"
          md="4"
        >
          <VLabel>Nombre:</VLabel>
          <SelectorPro
            v-model:item-selected="filtros.user_id"
            url="api/users"
            placeholder="Escribe para buscar..."
            item-value="id"
            item-title="nombre_completo"
            :campos-a-filtrar="['buscarPorNombre']"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VLabel>CUA:</VLabel>
          <VTextField v-model="filtros.codigo_cliente_unico" />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VLabel>Usuario Dominio:</VLabel>
          <VTextField v-model="filtros.usuario_dominio" />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VLabel>Región:</VLabel>
          <SelectorPro
            v-model:item-selected="filtros.region_id"
            url="api/catalogo/regiones"
            placeholder="Escribe para buscar..."
            item-value="id"
            item-title="nombre"
            :campos-a-filtrar="['nombre']"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VLabel>Unidad:</VLabel>
          <SelectorPro
            v-model:item-selected="filtros.unidad_id"
            url="api/catalogo/unidades"
            placeholder="Escribe para buscar..."
            item-value="id"
            item-title="nombre"
            :campos-a-filtrar="['nombre']"
            :disabled="!filtros.region_id"
            :filtros="filtrosUnidad"
          />
          <div
            v-if="!filtros.region_id"
            class="text-info text-caption mt-1"
          >
            Primero selecciona una región para habilitar este campo
          </div>
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VLabel>Puesto:</VLabel>
          <SelectorPro
            v-model:item-selected="filtros.puesto_id"
            url="api/catalogo/puestos"
            placeholder="Escribe para buscar..."
            item-value="id"
            item-title="nombre"
            :campos-a-filtrar="['nombre']"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VLabel>Rol:</VLabel>
          <SelectorPro
            v-model:item-selected="filtros.roles_id"
            url="api/catalogo/roles"
            placeholder="Escribe para buscar..."
            item-value="id"
            item-title="name"
            :campos-a-filtrar="['name']"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VLabel>Estado:</VLabel>
          <AppAutocomplete
            v-model="filtros.estado_id"
            :items="estados"
            item-title="nombre"
            item-value="id"
            placeholder="Estado"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
          class="text-end mt-4"
        >
          <VBtn
            type="reset"
            color="secondary"
            class="mr-2"
            @click="limpiarFiltros"
          >
            <VIcon
              icon="tabler-clear-all"
              start
              size="22"
            />
            Limpiar
          </VBtn>
          <VBtn
            type="submit"
            class="me-3"
            color="primary"
            @click="filtrar"
          >
            <VIcon
              icon="tabler-filter"
              start
              size="22"
            />
            Filtrar
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
  <VCard>
    <DataTableComponent
      ref="dataTable"
      :model="MODEL_TYPE_USER"
      :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
      :cantidad-por-pagina="5"
      :cantidad-por-pagina-opciones="[2, 3, 5]"
      :columnas="columnas"
      endpoint="/api/users"
    >
      <template #item.created_at="{ item }">
        {{ item.created_at ? formatearFecha(item.created_at) : "" }}
      </template>
      <template #item.Acciones="{ item }">
        <VBtn
          v-if="can('ver usuarios', 'User')"
          icon="tabler-eye"
          variant="tonal"
          v-tooltip="'Ver'"
          color="primary"
          :to="`/admin/usuarios/show/${item.id}`"
          class="mr-1"
        />
        <VBtn
          v-if="can('editar usuarios', 'User')"
          icon="tabler-edit"
          v-tooltip="'Editar'"
          variant="tonal"
          color="warning"
          :to="`/admin/usuarios/edit/${item.id}` "
          class="mr-1"
        />
        <VBtn
          v-if="can('eliminar usuarios', 'User')"
          icon="tabler-trash"
          v-tooltip="'Eliminar'"
          color="error"
          variant="tonal"
          @click="deleteItem(item.id)"
        />

        <VBtn
          v-if="can('restablecer contraseña usuario', 'User')"
          icon="tabler-refresh"
          color="error"
          v-tooltip="'Restablecer Contraseña'"
          variant="tonal"
          @click="resetPassword(item.id)"
        />
        <VBtn
          v-if="can('iniciar sesión como otro usuario', 'User') && entornoActual() === 'local'"
          icon="tabler-login"
          v-tooltip="'Iniciar Sesión Con Otro Usuario'"
          color="info"
          variant="tonal"
          @click="iniciarOtroUsuario(item.id)"
        />
      </template>
    </DataTableComponent>
  </VCard>
</template>
