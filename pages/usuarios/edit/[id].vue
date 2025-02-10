<script setup lang="ts">
import fields from '@/views/pages/usuarios/fields.vue'
import type { UsuarioInterface } from '@/types/usuarios/index.ts';
import {ref} from "vue";

definePageMeta({
  middleware: 'permissions',
  action: 'editar usuarios', // Acción requerida
  subject: 'usuarios',  // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
});

const { put, get  } = useClienteRequest();
const { showToastSuccess, showToastError } = useToast();
const route = useRoute();
const id = route.params.id;
const Usuario = ref(fields);
const { paginaEspera } = useCargandoPagina();
const requestInProgress = ref(false); // Evitar solicitudes concurrentes

const actualizarUsuario = async ( Usuario: UsuarioInterface ): Promise<void> => {
  if (!requestInProgress.value) {
    paginaEspera.value = true;
    requestInProgress.value = true;

    try {
      const respuesta = await put(`/api/users/${id}`, {
        ...Usuario,
        roles: Usuario.roles.map(role => role.id),
        permissions: Usuario.permissions.map(permission => permission.id),
      });
      console.log("Respuesta del backend:", respuesta);
      showToastSuccess(respuesta.message);
      navigateTo('/usuarios');

    } catch (error) {
      showToastError(error.message);
    } finally {
      paginaEspera.value = false;
      requestInProgress.value = false;
    }
  }
}

const itemUsuario = ref( <UsuarioInterface>
{ id: null,
usuario_dominio: null,
cif: null,
asociado_id: null,
codigo_bankworks: null,
codigo_ejecutivo: null,
fecha_labores: null,
email: null,
nombre: null,
apellido: null,
password: null,
estado: null,
nuevoPassword: null,
fecha_entra_vacaciones: null,
fecha_sale_vaciones: null,
puesto_id: null,
region_id: null,
gerencia_id: null,
revisor_id: null,
unidad_id: null,
fecha_puestoactual: null,
dpi: null,
categoria_oficial_id: null,
numero_cuenta_comision: null,
solicitudcredito_verificador: null,
solicitudcredito_gestor: null,
solicitudcredito_operador: null,
solicitudcredito_analista: null,
cola_solitudes_analisis_operador_formalizacion: null,
cola_solitudes_analisis_gestor_formalizacion: null,
ctc_ventas: null,
ctc_sclientes: null,
ctc_cobros: null,
gestiones_crm_vencidas: null }
)

const getUsuario = async () => {

  try {

    paginaEspera.value = true;

    const respuesta: { data: UsuarioInterface } = await get('/api/users/' + id );

    itemUsuario.value = {
      ...respuesta.data,
      roles: Array.isArray(respuesta.data.roles) ? respuesta.data.roles : [],

      isDisabledEdit: true };

  } catch (error: { message: string }) {

    showToastError(error.message);

  }

  paginaEspera.value = false;

}

getUsuario();

const puedeMostrarDatos = computed(() => {

  return Object.values(itemUsuario .value).some(valor => valor !== null && valor !== undefined);

});

</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <h1>Gestión de Roles</h1>
    <VBtn
      class="ml-auto"
      prepend-icon="tabler-arrow-left"
      to="/usuarios/"
    >
      Regresar
    </VBtn>
  </div>

  <VCard>
      <VCardText>
        <fields
          :fields="fields"
          v-if="puedeMostrarDatos"
          :item="itemUsuario"
          @emitirDatos="actualizarUsuario"
        />
      </VCardText>
  </VCard>
</template>
