<script setup lang="ts">
import {ref} from 'vue'
import type {VForm} from "vuetify/lib/components/VForm";
import { ORIGINADOR } from '@/constantes/Const-Sistema'

const refForm = ref<VForm>()
const {post, get} = useClienteRequest()
const {showToastSuccess, showToastError} = useToast();
const requestInProgress = ref(false)
const {paginaEspera} = useCargandoPagina();

interface DocumentoInterface {
  logo_claro: string,
  logo_oscuro: string,
  fondo_login_claro: string,
  fondo_login_oscuro: string,
}

const documentos = ref<DocumentoInterface>({
  logo_claro: '',
  logo_oscuro: '',
  fondo_login_claro: '',
  fondo_login_oscuro: '',
});

const data = ref({
  nombre_empresa: '',
  telefono_empresa: '',
  whatsapp_empresa: '',
  direccion_empresa: '',
  correo_empresa: '',
  horario: '',
  logo_claro: '',
  logo_oscuro: '',
  fondo_login_claro: '',
  fondo_login_oscuro: '',
});


const onSubmit = async (): Promise<void> => {
  if (requestInProgress.value) return


  const resultado = await refForm.value?.validate()
  if (!resultado?.valid) return // detiene envío si hay errores

    requestInProgress.value = true;
    paginaEspera.value = true;

    try {

      const respuesta: { message: string } = await post('/api/configuracions/storePanelSistema', data.value);

      showToastSuccess(respuesta.message);

    } catch (error: any) {

      showToastError(error.message);

    } finally {

      paginaEspera.value = false;

      requestInProgress.value = false;

    }
};

const getImagenes = async (): Promise<void> => {

  try {

    const respuesta: { data: any } = await get('api/configuraciones/imagen/getActuales');

    documentos.value.logo_claro = respuesta.data.Logo_Claro;

    documentos.value.logo_oscuro = respuesta.data.Logo_Oscuro;

    documentos.value.fondo_login_claro = respuesta.data.Fondo_Login_Claro;

    documentos.value.fondo_login_oscuro = respuesta.data.Fondo_Login_Oscuro;

  } catch (error: any) {

    showToastError(error.message);

  }
}

const obtenerInfoPanel = async (): Promise<void> => {

  try {

    const grupo = 'panel_sistema'
    const respuesta: { data: any } = await get('api/configuracions/obtenerInfoPanel', {
      params: { grupo }
    })

    data.value.nombre_empresa = respuesta.data.nombre_empresa
    data.value.telefono_empresa = respuesta.data.telefono_empresa
    data.value.whatsapp_empresa = respuesta.data.whatsapp_empresa
    data.value.direccion_empresa = respuesta.data.direccion_empresa
    data.value.correo_empresa = respuesta.data.correo_empresa
    data.value.horario = respuesta.data.horario

  } catch (error: any) {

    showToastError(error.message)

  }
}


getImagenes()
obtenerInfoPanel()
</script>

<template>

  <VForm ref="refForm" @submit.prevent="onSubmit">

    <VRow>

      <VCol cols="12" md="6">
        <AppTextField
          v-model="data.nombre_empresa"
          label="Nombre Empresa"
          placeholder="Ingrese Nombre de la Empresa"
          :rules="[requiredValidator]"
        />
      </VCol>

      <VCol cols="12" md="6">
        <AppTextField
          v-model.number="data.telefono_empresa"
          label="Teléfono Empresa"
          placeholder="Ingrese Teléfono de la Empresa"
          type="number"
          :rules="[requiredValidator, integerValidator]"
        />
      </VCol>

      <VCol cols="12" md="6">
        <AppTextField
          v-model.number="data.whatsapp_empresa"
          label="Whatsapp Empresa"
          placeholder="Ingrese Whatsapp de la Empresa"
          type="number"
          :rules="[requiredValidator, integerValidator]"
        />
      </VCol>

      <VCol cols="12" md="6">
        <AppTextField
          v-model="data.direccion_empresa"
          label="Dirección Empresa"
          placeholder="Ingrese Dirección de la Empresa"
          :rules="[requiredValidator]"
        />
      </VCol>

      <VCol cols="12" md="6">
        <AppTextField
          v-model="data.correo_empresa"
          label="Correo Empresa"
          placeholder="Ingrese Correo de la Empresa"
          :rules="[requiredValidator, emailValidator]"
        />
      </VCol>

      <VCol cols="12" md="6">
        <AppTextField
          v-model="data.horario"
          label="Horario"
          placeholder="Ingrese Horario de la Empresa"
          :rules="[requiredValidator]"
        />
      </VCol>

      <VDivider
        class="my-4"
        style="border-style: dashed;"
      />

<!--      <VCol md="12" class="d-flex">-->

<!--        <VCol cols="6">-->
<!--          <VLabel>Logo Tema Claro:</VLabel>-->

<!--          <FileInput-->
<!--            name="logo_claro"-->
<!--            v-model="data.logo_claro"-->
<!--            label-idle="Seleccione una imagen"-->
<!--            allow-multiple-->
<!--            max-files="1"-->
<!--            :rules="[requiredValidator]"-->
<!--            url="api/configuraciones/imagen-configuracions"-->
<!--            :files="documentos.logo_claro"-->
<!--          />-->

<!--        </VCol>-->

<!--        <VCol cols="6">-->
<!--          <VLabel>Logo Tema Oscuro:</VLabel>-->
<!--          <FileInput-->
<!--            name="logo_oscuro"-->
<!--            v-model="data.logo_oscuro"-->
<!--            label-idle="Seleccione una imagen"-->
<!--            :rules="[requiredValidator]"-->
<!--            placeholder="Seleccione el Logo"-->
<!--            :files="documentos.logo_oscuro"-->
<!--            url="api/configuraciones/imagen-configuracions"-->
<!--          />-->

<!--        </VCol>-->
<!--      </VCol>-->

      <VCol cols="12" md="12" class="d-flex">

        <VCol cols="6">
          <VLabel
            class="mb-6"
            text="Fondo Login Claro"
          />
          <InputFile
            :multiple="false"
            subida-automatica
            url-subida="/api/configuraciones/imagen/configuracions"
            url-eliminacion="/api/media"
            :destino="ORIGINADOR"
            name="fondo_login_claro"
            :coleccion="'fondo_login_claro'"
            accept=".png,.jpg"
            model_type="x"
            :model_id="1"
            :previsualizar-archivos="[documentos.fondo_login_claro]"

          />
        </VCol>

        <VCol cols="6">
          <VLabel
            class="mb-6"
            text="Fondo Login Oscuro"
          />
          <InputFile
            :multiple="false"
            subida-automatica
            url-subida="/api/configuraciones/imagen/configuracions"
            url-eliminacion="/api/media"
            :destino="ORIGINADOR"
            name="fondo_login_oscuro"
            :coleccion="'fondo_login_oscuro'"
            accept=".png,.jpg"
            model_type="x"
            :model_id="1"
            :previsualizar-archivos="[documentos.fondo_login_oscuro]"
          />
        </VCol>
      </VCol>

      <!--      <VCol cols="12" md="12" class="d-flex">-->
      <!--        -->
      <!--        <VCol cols="6">-->
      <!--          <VLabel>Icono Claro:</VLabel>-->
      <!--          <FileInput-->
      <!--              name="logo"-->
      <!--              v-model="data.icono"-->
      <!--              label-idle="Seleccione una imagen"-->
      <!--              :rules="[requiredValidator]"-->
      <!--              placeholder="Seleccione el Logo"-->
      <!--              :server="serverConfig"-->
      <!--              :files="data.icono"-->
      <!--              accept="application/pdf"-->
      <!--          />-->
      <!--        </VCol>-->

      <!--        <VCol cols="6">-->
      <!--          <VLabel>Icono Login Oscuro:</VLabel>-->
      <!--          <FileInput-->
      <!--              name="logo"-->
      <!--              v-model="data.icono"-->
      <!--              label-idle="Seleccione una imagen"-->
      <!--              :rules="[requiredValidator]"-->
      <!--              placeholder="Seleccione el Logo"-->
      <!--              :server="serverConfig"-->
      <!--              :files="data.icono"-->
      <!--              accept="application/pdf"-->
      <!--          />-->
      <!--        </VCol>-->
      <!--      </VCol>-->

      <VCol cols="12" class="d-flex justify-end">
        <VBtn type="submit"
              text="guardar"
              class="mr-2"
        />
        <VBtn type="reset"
              variant="tonal"
              color="error"
              text="Cancelar"
        />
      </VCol>

    </VRow>

  </VForm>

</template>

<style scoped lang="scss">
</style>
