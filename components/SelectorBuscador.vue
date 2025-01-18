<script lang="ts" setup>
import { defineProps, nextTick, ref, watch } from 'vue';

const { showToastError } = useToast();
const clienteApi = useClienteRequestSigua();

const emit = defineEmits();

const props = withDefaults(
  defineProps<{
    requerido?: boolean;
    minCaracteres?: number;
    delay?: number;
    title?: string;
    Endpoint?: string;
    placeholder?: string;
  }>(),
  {
    placeholder: 'Ingrese dpi, cif o cua',
    requerido: true,
    delay: 500,
  }
);

const opcion = ref(); // Valor seleccionado
const opciones = ref([]); // Lista de opciones
const loading = ref(false); // Indicador de carga
const busquedaRealizada = ref(false); // Indicador de búsqueda realizada

const rules = {
  required: (value: string) =>
    props.requerido ? (!!value || 'El campo es requerido.') : true,
  min: (v: string) =>
    props.minCaracteres
      ? v?.length >= props.minCaracteres || `Mínimo ${props.minCaracteres} caracteres.`
      : true,
};

const buscarAsociado = async (search: string) => {
  const cantCaracteres = search.length;

  if (props.minCaracteres && cantCaracteres < props.minCaracteres) return;

  loading.value = true;

  try {
    const respuesta = await clienteApi.get(props?.Endpoint, {
      params: {
        search,
      },
    });

    busquedaRealizada.value = true;

    if (respuesta?.data) {
      opciones.value = respuesta?.data;
    } else {
      opciones.value = [];
    }
  } catch (error: any) {
    showToastError(`Error al buscar ${props.title}: ${error?.message}`,);
  } finally {
    loading.value = false;
  }
};

let times: ReturnType<typeof setTimeout>;

const eventoBuscar = (newValue: string) => {
  clearTimeout(times);

  if (!newValue) {
    // Si el input está vacío, reinicia las opciones
    opciones.value = [];
    busquedaRealizada.value = false;
    return;
  }

  times = setTimeout(() => {
    nextTick(() => {
      buscarAsociado(newValue);
    });
  }, props.delay || 500);
};

watch(opcion, (newValue) => {
  if (newValue) {
    loading.value = false;
    emit('data', newValue);
    // Si el valor seleccionado no tiene `id`, limpia el select
    if (!newValue.id) {
      opcion.value = null;
    }
  }
});
</script>

<template>
  <div>
    <AppCombobox
      v-model="opcion"
      :rules="[rules.required, rules.min]"
      :items="opciones"
      :label="props.title || 'Buscador'"
      :placeholder="props.placeholder"
      item-title="text"
      chips
      :hint="props.minCaracteres ? `Mínimo ${props.minCaracteres} caracteres` : ''"
      clearable
      counter
      @update:search="eventoBuscar"
      :loading="loading"
      :noFilter="true"
      :no-data-text="busquedaRealizada && !loading && opciones.length === 0 ? 'No se encontraron resultados' : ''"
      :hide-no-data="!busquedaRealizada || loading"
    />
  </div>
</template>
