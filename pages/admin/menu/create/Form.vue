<script lang="ts" setup>

//Importaciones
const {post} = useClienteRequest()

const {showToastSuccess, showToastError} = useToast();

const router = useRouter();

import {ref} from "vue";

//interfaces
interface Item {
  titulo?: string | null;
  icono?: string | null;
  ruta?: string | null;
  titulo_seccion?: string | null;
  parent_id?: string | null;
  action?: string | null;
  subject?: string | null;
}

//definir los props
const props = defineProps<{parentId: string | null}>();

//Variables
const esTituloSeccion = ref<boolean>(false);

const formOpcion = ref<InstanceType<typeof VForm>>();

const formTituloSeccion = ref<InstanceType<typeof VForm>>();

const opcion = ref<Item>({
  titulo: null,
  icono: null,
  ruta: null,
  titulo_seccion: null,
  parent_id: props.parentId,
  action: null,
  subject: null,
});

const rutasSistema = <object>router.getRoutes();

//Funciones
const submit = async (): Promise<void> => {
  try {
    const response = await post("api/menu_opciones", opcion.value);
    showToastSuccess(response.message);
    navigateTo("/admin/menu");
  } catch (error: any) {
    showToastError(error.message);
  }
};

const onSubmitFormOpcion = (): void => {
  if (formOpcion.value?.validate()) {
    submit();
  }
};

const onSubmitFormTituloSeccion = (): void => {
  if (formTituloSeccion.value?.validate()) {
    submit();
  }
};

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


    <VCol cols="12" class="d-flex flex-wrap" v-if="!props.parentId" >
      <p class="text-h6 mt-3 ml-2 mr-2">¿Es un título de sección?</p>
      <VSwitch v-model="esTituloSeccion"/>
    </VCol>

    <VForm
      ref="formOpcion"
      @submit.prevent="onSubmitFormOpcion"
      v-if="!esTituloSeccion"
    >
      <VCol cols="12" class="d-flex flex-wrap">
        <VCol cols="12" md="6">
          <AppTextField
            v-model="opcion.titulo"
            label="Titulo"
            :rules="[requiredValidator]"
          />
        </VCol>

        <VCol cols="12" md="6">

          <AppAutocomplete
            label="Ruta:"
            :items="rutasSistema"
            item-title="name"
            item-value="name"
            v-model="opcion.ruta"
            placeholder="Seleccione una ruta"
          />
        </VCol>

        <VCol cols="12" md="6">
          <AppTextField
            v-model="opcion.icono"
            label="Icono"
          />
        </VCol>

        <VCol cols="12" md="6">
          <AppTextField
            v-model="opcion.action"
            label="Acción"
            :rules="[requiredValidator]"
          />
        </VCol>

        <VCol cols="12" md="6">
          <AppTextField
            v-model="opcion.subject"
            label="Subject"
            :rules="[requiredValidator]"
          />
        </VCol>

        <VCol cols="12" class="d-flex gap-4">
          <VBtn type="submit">Submit</VBtn>
          <VBtn type="reset" color="secondary" variant="tonal">Reset</VBtn>
        </VCol>
      </VCol>
    </VForm>

    <VForm
      ref="formTituloSeccion"
      @submit.prevent="onSubmitFormTituloSeccion"
      v-if="esTituloSeccion"
    >
      <VCol cols="12" class="d-flex flex-wrap">
        <VCol cols="12" md="6">
          <AppTextField
            v-model="opcion.titulo_seccion"
            label="Titulo Sección"
            :rules="[requiredValidator]"
          />
        </VCol>

        <VCol cols="12" md="6">
          <AppTextField
            v-model="opcion.action"
            label="Acción"
            :rules="[requiredValidator]"
          />
        </VCol>

        <VCol cols="12" md="6">
          <AppTextField
            v-model="opcion.subject"
            label="Subject"
            :rules="[requiredValidator]"
          />
        </VCol>
      </VCol>

      <VCol cols="12" class="d-flex gap-4">
        <VBtn type="submit">Submit</VBtn>
        <VBtn type="reset" color="secondary" variant="tonal">Reset</VBtn>
      </VCol>
    </VForm>

</template>
