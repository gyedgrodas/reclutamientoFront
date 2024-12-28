<script setup lang="ts">
import { ref, watch } from 'vue';
import { UseApi } from "@/composables/useApi";
import AddNuevoUsuario from "@/views/pages/usuarios/AddNuevoUsuario.vue";

const { fetchGet , fetchPost } = UseApi();


const user = useSanctumUser()
// Variables reactivas para manejar la tabla y la paginación
const users = ref([]); // Lista de usuarios
const currentPage = ref(1); // Página actual
const itemsPerPage = ref(2); // Elementos por página
const totalItems = ref(0); // Total de elementos en el backend
const loading = ref(false); // Indicador de carga
const requestInProgress = ref(false); // Evitar solicitudes concurrentes
const search = ref(''); // Búsqueda de usuarios
const agregarUsuario = ref(false); // Mostrar el cajón para agregar un nuevo usuario

// Función para obtener los usuarios desde el backend
const fetchUsers = async () => {
  // Evitar solicitudes concurrentes
  if (requestInProgress.value) return;

  requestInProgress.value = true; // Establecer bandera de solicitud en progreso
  loading.value = true; // Activar indicador de carga
  try {
    // Solicitud con los parámetros de paginación
    const response = await fetchGet('/api/users', {
      params: {
        'page[number]': currentPage.value,
        'page[size]': itemsPerPage.value,
      },
    });


    console.log(response);

    if (response) {
      // Actualiza los datos de usuarios y la paginación
      users.value = response.data; // Lista de usuarios
      totalItems.value = response.meta.total; // Total de registros en el backend
      itemsPerPage.value = response.meta.per_page; // Elementos por página
      currentPage.value = response.meta.current_page; // Página actual
    }
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
  } finally {
    loading.value = false; // Desactivar indicador de carga
    requestInProgress.value = false; // Liberar la bandera
  }
};

// Observar cambios en la página o el tamaño de los elementos por página
watch([currentPage, itemsPerPage], () => {
  fetchUsers(); // Vuelve a cargar los datos cuando cambian la página o el tamaño
});

// Carga inicial de los datos al montar el componente
fetchUsers();

// Configuración de los encabezados de la tabla
const headers = [
  { title: 'ID', value: 'id' },
  { title: 'NOMBRE', value: 'attributes.nombre' },
  { title: 'EMAIL', value: 'attributes.email' },
  { title: 'CREADO', value: 'attributes.created-at' },
  { title: 'ACTUALIZADO', value: 'attributes.updated-at' },
  { title: 'ACCIONES', value: 'actions', sortable: false },
];



const addNuevoUsuario = async (userData: any) => {
  console.log(userData.data);
  const response  = await fetchPost('/api/users', userData.data, 'users', userData.relationships);

  if(response){
    fetchUsers();
  }
}

// Función para editar un usuario
const editUser = (user:any) => {
 //levatar un modal que esta el view




};

</script>

<template>
  <div>
    <VCardText class="d-flex flex-wrap gap-4">
      <div class="me-3 d-flex gap-3">
        <AppSelect
          :model-value="itemsPerPage"
          :items="[
              { value: 2, title: '2' },
              { value: 10, title: '10' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: 100, title: '100' },
              { value: -1, title: 'All' },
            ]"
          style="inline-size: 6.25rem;"
          @update:model-value="itemsPerPage = parseInt($event, 10)"
        />
      </div>
      <VSpacer />

      <div class="app-user-search-filter d-flex align-center flex-wrap gap-4">
        <!-- 👉 Search  -->
        <div style="inline-size: 15.625rem;">
          <AppTextField
            v-model="search"
            placeholder="Search User"
          />
        </div>

        <!-- 👉 Export button -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-upload"
        >
          Export
        </VBtn>

        <!-- Botón para agregar un nuevo usuario -->
        <VBtn
          prepend-icon="tabler-plus"
          @click="agregarUsuario = true"
        >
          Add New User
        </VBtn>
      </div>
    </VCardText>
    <h1>{{user?.nombre || user?.usuario_dominio}}</h1>
    <VDataTableServer
      v-model:items-per-page="itemsPerPage"
      v-model:page="currentPage"
      :items="users"
      :headers="headers"
      :search="search"
      item-value="id"
      :items-length="totalItems"
      :items-per-page-options="[2, 5, 10, 50, -1]"
      :loading="loading"
      show-select
    >
      <template #item.actions="{ item }">
        <VBtn
          icon
          variant="text"
          color="primary"
          @click="editUser(item)"
        >
          <VIcon icon="tabler-edit" />
        </VBtn>
        <VBtn
          icon
          color="error"
          variant="text"
          @click="deleteUser(item)"
        >
          <VIcon icon="tabler-trash" />
        </VBtn>
      </template>

    </VDataTableServer>

    <!-- Cajón para agregar un nuevo usuario -->
    <AddNuevoUsuario
      v-model:es-visible="agregarUsuario"
      @user-data="addNuevoUsuario"
    />
  </div>
</template>

<style scoped>
/* Agrega estilos personalizados aquí si es necesario */
</style>
