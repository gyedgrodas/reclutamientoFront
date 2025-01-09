<script lang="ts" setup>

import {ref} from "vue";

interface Item {
  titulo?: string | null;
  icono?: string | null;
  ruta?: string | null;
  titulo_seccion?: string | null;
  parent_id?: string | null;
  action?: string | null;
  subject?: string | null;
}

const opcion = ref<Item>({
  titulo: null,
  icono: null,
  ruta: null,
  titulo_seccion: null,
  parent_id: null,
  action: null,
  subject: null,
});

const esTituloSeccion = ref<boolean>(false);

const formOpcion = ref();

const formTituloSeccion = ref();

const { Post } = useJsonApiClient();

const {showToastSuccess, showToastError} = useToast();

const submit = async () => {

  try {

    const response = await Post('api/menu_opciones', opcion.value);

    showToastSuccess(response.message);

    navigateTo('/admin/menu');

  } catch (error) {

    showToastError(error.message);

  }

}

const onSubmitFormOpcion = () => {
  if (formOpcion.value.validate()) {
    submit();
  }
}

const onSubmitFormTituloSeccion = () => {
  if (formTituloSeccion.value.validate()) {
    submit();
  }
}

watch(esTituloSeccion, (newVal) => {
  if (newVal) {
    opcion.value = {
      titulo_seccion: opcion.value.titulo_seccion,
      action: opcion.value.action,
      subject: opcion.value.subject,
    };
  } else {
    opcion.value = {
      titulo: opcion.value.titulo,
      ruta: opcion.value.ruta,
      icono: opcion.value.icono,
      action: opcion.value.action,
      subject: opcion.value.subject,
    };
  }
});

</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="secondary"
    >
      Regresar
    </VBtn>
  </div>

  <v-card>


    <v-card-title>Configurar Menu</v-card-title>

    <v-card-text>

      <VCol cols="12"
            class="d-flex flex-wrap">
        <p
          class="text-h6 mt-3 ml-2 mr-2"
        >¿Es un título de sección?</p>
        <VSwitch
          v-model="esTituloSeccion"
        />
      </VCol>

      <VForm
        ref="formOpcion"
        @submit.prevent="onSubmitFormOpcion"
        v-if="!esTituloSeccion"
      >
        <VCol
          cols="12"
          class="d-flex flex-wrap "
        >
          <VCol cols="12"
                md="6"
          >
            <AppTextField
              v-if="!esTituloSeccion"
              v-model="opcion.titulo"
              label="Titulo"
              :rules="[requiredValidator]"
            />
          </VCol>

          <VCol cols="12"
                md="6"
          >
            <AppTextField
              v-if="!esTituloSeccion"
              v-model="opcion.ruta"
              label="Ruta"
              :rules="[requiredValidator]"
            />
          </VCol>

          <VCol cols="12"
                md="6"
          >
            <AppTextField
              v-model="opcion.icono"
              label="Icono"

            />
          </VCol>

          <VCol cols="12"
                md="6"
          >
            <AppTextField
              v-model="opcion.action"
              label="Actión"
              :rules="[requiredValidator]"
            />
          </VCol>

          <VCol cols="12"
                md="6"
          >
            <AppTextField
              v-model="opcion.subject"
              label="Subject"
              :rules="[requiredValidator]"
            />
          </VCol>

          <VCol cols="12"
                class="d-flex gap-4"
          >
            <VBtn
              type="submit"
            >
              Submit
            </VBtn>

            <VBtn
              type="reset"
              color="secondary"
              variant="tonal"
            >
              Reset
            </VBtn>
          </VCol>

        </VCol>

      </VForm>


      <VForm
        ref="formTituloSeccion"
        @submit.prevent="onSubmitFormTituloSeccion"
        v-if="esTituloSeccion">

        <VCol cols="12"
          class="d-flex flex-wrap"
        >
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-if="esTituloSeccion"
              v-model="opcion.titulo_seccion"
              label="Titulo Sección"
              :rules="[requiredValidator ]"
            />
          </VCol>


          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="opcion.action"
              label="Actión"
              :rules="[requiredValidator]"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="opcion.subject"
              label="Subject"
              :rules="[requiredValidator]"
            />
          </VCol>

        </VCol>

        <VCol cols="12"
          class="d-flex gap-4"
        >
          <VBtn
            type="submit"
          >
            Submit
          </VBtn>

          <VBtn
            type="reset"
            color="secondary"
            variant="tonal"
          >
            Reset
          </VBtn>
        </VCol>

      </VForm>


    </v-card-text>

  </v-card>

</template>
