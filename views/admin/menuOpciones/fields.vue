<script lang="ts" setup>
// Importaciones necesarias
import type {VForm} from "vuetify/components/VForm";
import type {MenuOpcion} from "@/types/admin/menuOpciones/types";
import {ref, watch} from "vue";
import {useRouter} from "vue-router";

const props = defineProps<{
  parentId: number | null;
  item: MenuOpcion | null;
}>();

const emit = defineEmits<{
  (event: "Datos", value: MenuOpcion): void;
}>();

// const esTituloSeccion = ref(() => {
//   return true
// });

const esTituloSeccion = ref(false);

const formOpcion = ref<InstanceType<typeof VForm>>();
const formTituloSeccion = ref<InstanceType<typeof VForm>>();

const opcion = ref<MenuOpcion>({
  titulo: null,
  icono: null,
  ruta: null,
  titulo_seccion: null,
  parent_id: props.parentId ?? null,
  action: null,
  subject: null,
});

const router = useRouter();
const rutasSistema = router.getRoutes();

const onSubmitFormOpcion = (): void => {
  if (formOpcion.value?.validate()) {
    emit("Datos", opcion.value);
  }
};

const onSubmitFormTituloSeccion = (): void => {
  if (formTituloSeccion.value?.validate()) {
    emit("Datos", opcion.value);
  }
};

watch(esTituloSeccion, (newVal) => {
  if (newVal) {
    opcion.value = {
      titulo_seccion: opcion.value.titulo_seccion,
      action: opcion.value.action,
      subject: opcion.value.subject,
      parent_id: props.parentId ?? null,
    };
  } else {
    opcion.value = {
      titulo: opcion.value.titulo,
      icono: opcion.value.icono,
      ruta: opcion.value.ruta,
      action: opcion.value.action,
      subject: opcion.value.subject,
      parent_id: props.parentId ?? null,
    };
  }
});

watch(() => props.item, (newVal) => {
  if (newVal) {
    opcion.value = {...newVal};
  }
});
</script>

<template>

  <VCol v-if="!props.parentId" class="d-flex flex-wrap" cols="12">
    <p class="text-h6 mt-3 ml-2 mr-2">¿Es un título de sección?</p>
    <VSwitch v-model="esTituloSeccion"/>
  </VCol>

  <VForm v-if="!esTituloSeccion"
         ref="formOpcion"
         @submit.prevent="onSubmitFormOpcion"
  >
    <VCol class="d-flex flex-wrap" cols="12">
      <VCol cols="12" md="6">
        <AppTextField v-model="opcion.titulo" :rules="[requiredValidator]" label="Título"/>
      </VCol>

      <VCol cols="12" md="6">
        <AppAutocomplete
          v-model="opcion.ruta"
          :items="rutasSistema"
          item-title="name"
          item-value="name"
          label="Ruta"
          placeholder="Seleccione una ruta"
        />
      </VCol>

      <VCol cols="12" md="6">
        <AppTextField v-model="opcion.icono" label="Icono"/>
      </VCol>

      <VCol cols="12" md="6">
        <AppTextField v-model="opcion.action" :rules="[requiredValidator]" label="Acción"/>
      </VCol>

      <VCol cols="12" md="6">
        <AppTextField v-model="opcion.subject" :rules="[requiredValidator]" label="Subject"/>
      </VCol>

      <VCol class="d-flex gap-4" cols="12">
        <VBtn type="submit">Submit</VBtn>
        <VBtn color="secondary" type="reset" variant="tonal">Reset</VBtn>
      </VCol>
    </VCol>
  </VForm>

  <VForm v-else
         ref="formTituloSeccion"
         @submit.prevent="onSubmitFormTituloSeccion"
  >
    <VCol class="d-flex flex-wrap" cols="12">
      <VCol cols="12" md="6">
        <AppTextField
          v-model="opcion.titulo_seccion"
          :rules="[requiredValidator]"
          label="Título Sección"
        />
      </VCol>

      <VCol cols="12" md="6">
        <AppTextField v-model="opcion.action" :rules="[requiredValidator]" label="Acción"/>
      </VCol>

      <VCol cols="12" md="6">
        <AppTextField v-model="opcion.subject" :rules="[requiredValidator]" label="Subject"/>
      </VCol>
    </VCol>

    <VCol class="d-flex gap-4" cols="12">
      <VBtn type="submit">Submit</VBtn>
      <VBtn color="secondary" type="reset" variant="tonal">Reset</VBtn>
    </VCol>
  </VForm>

</template>
