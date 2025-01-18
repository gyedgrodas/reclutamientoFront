<script setup lang="ts">

definePageMeta({
  middleware: 'permissions',
  action: 'ver usuarios', // Acción requerida
  subject: 'usuarios',  // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
});

import type { UsuarioInterface } from '@/types/usuarios/index.ts';

import {ref} from "vue";

const { get } = useClienteRequest();

const { showToastSuccess, showToastError } = useToast();

const route = useRoute();

const id = route.params.id;

const { paginaEspera } = useCargandoPagina();

const item = ref( <UsuarioInterface>
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

    item.value = respuesta.data;


  } catch (error: { message: string }) {

    showToastError(error.message);

  }

  paginaEspera.value = false;

}

const puedeMostrarDatos = computed(() => {

  return Object.values(item.value).some(valor => valor !== null && valor !== undefined);

});

getUsuario();

</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="secondary"
      to="/usuarios/"
    >
      Regresar
    </VBtn>
  </div>

  <VCard>

    <VCardItem>

      <VCardTitle>Visualizar Usuario</VCardTitle>

    </VCardItem>

    <VCardText>

      <VList class="card-list mt-2" v-if="puedeMostrarDatos">

        
              <VListItemTitle>
                <h6 class="text-h6">
                    :
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.id }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Usuario Dominio:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.usuario_dominio }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Cif:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.cif }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Asociado:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.asociado_id }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Codigo Bankworks:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.codigo_bankworks }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Codigo Ejecutivo:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.codigo_ejecutivo }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Fecha Labores:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.fecha_labores }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Email:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.email }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Nombre:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.nombre }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Apellido:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.apellido }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Password:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.password }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Estado:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.estado }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    NuevoPassword:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.nuevoPassword }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Fecha Entra Vacaciones:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.fecha_entra_vacaciones }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Fecha Sale Vaciones:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.fecha_sale_vaciones }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Puesto:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.puesto_id }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Region:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.region_id }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Gerencia:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.gerencia_id }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Revisor:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.revisor_id }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Unidad:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.unidad_id }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Fecha Puestoactual:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.fecha_puestoactual }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Dpi:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.dpi }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Categoria Oficial:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.categoria_oficial_id }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Numero Cuenta Comision:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.numero_cuenta_comision }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Solicitudcredito Verificador:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.solicitudcredito_verificador }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Solicitudcredito Gestor:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.solicitudcredito_gestor }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Solicitudcredito Operador:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.solicitudcredito_operador }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Solicitudcredito Analista:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.solicitudcredito_analista }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Cola Solitudes Analisis Operador Formalizacion:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.cola_solitudes_analisis_operador_formalizacion }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Cola Solitudes Analisis Gestor Formalizacion:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.cola_solitudes_analisis_gestor_formalizacion }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Ctc Ventas:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.ctc_ventas }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Ctc Sclientes:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.ctc_sclientes }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Ctc Cobros:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.ctc_cobros }}
                  </div>
                </h6>
              </VListItemTitle>
            
              <VListItemTitle>
                <h6 class="text-h6">
                    Gestiones Crm Vencidas:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ item.gestiones_crm_vencidas }}
                  </div>
                </h6>
              </VListItemTitle>
            

      </VList>

    </VCardText>

  </VCard>

</template>

<style scoped lang="scss">

</style>
