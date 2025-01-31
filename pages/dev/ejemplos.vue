<script lang="ts" setup>
import EjemploDataTable from '@/views/pages/ejemplos/dataTable/ejemploDataTable.vue'

const { showToastInfo, showToastSuccess, showToastWarning, showToastError } = useToast()
const { paginaEspera, cargandoPagina } = useCargandoPagina()
const { getCatalogos, catalogos } = useCatalogo()

const mostrarToastInfo = () => {
  showToastInfo('Hello from second page')
}

const mostrarToastSuccess = () => {
  showToastSuccess('Hello from second page')
}

const mostrarToastWarning = () => {
  showToastWarning('Hello from second page')
}

const mostrarToastError = () => {
  showToastError('Hello from second page')
}

const activarPaginaEspera = () => {
  paginaEspera.value = true // Activar la pagina de espera

  setTimeout(() => {
    paginaEspera.value = false // Desactivar la pagina de espera
  }, 1500)
}

const activarPaginaCargando = () => {
  cargandoPagina.value = true // Activar la página cargando
  setTimeout(() => {
    cargandoPagina.value = false // Desactivar la página cargando
  }, 1500)
}

const data = reactive({
  puesto_id: null,
  unidad_id: null,
})

// Manejo de catalogs
const loadCatalogs = async () => {
  try {
    await getCatalogos(['puestos', 'unidades'])
  }
  catch (error) {
    showToastError(error.message)
  }
}

onMounted(loadCatalogs)
</script>

<template>
  <VCard class="mb-5">
    <VCardTitle>Toast</VCardTitle>
    <VCardText class="d-flex justify-space-between v-col-sm-10 offset-1">
      <VBtn
        border="border"
        @click="mostrarToastSuccess"
      >
        Mostrar Toast Success
      </VBtn>

      <VBtn
        color="error"
        @click="mostrarToastError"
      >
        Mostrar Toast Error
      </VBtn>

      <VBtn
        color="warning"
        @click="mostrarToastWarning"
      >
        Mostrar Toast Warning
      </VBtn>

      <VBtn
        color="info"
        @click="mostrarToastInfo"
      >
        Mostrar Toast Info
      </VBtn>
    </VCardText>
  </VCard>

  <VCard class="mb-5">
    <VCardTitle>Página Cargando</VCardTitle>
    <VCardText class="d-flex justify-space-between v-col-sm-5 offset-3">
      <VBtn
        color="info"
        @click="activarPaginaEspera"
      >
        Pagina Espera
      </VBtn>

      <VBtn
        color="warning"
        @click="activarPaginaCargando"
      >
        Pagina Cargando
      </VBtn>
    </VCardText>
  </VCard>

  <VCard class="mb-12">
    <VCardTitle>Buscador General</VCardTitle>
    <VCardText>
      <SelectorBuscador
        title="Buscar Asociado"
        placeholder="Ingrese el nombre del asociado "
        Endpoint="/api/asociados/buscar/select2/"
        requerido
      />
    </VCardText>
  </VCard>

  <VCard class="mb-12">
    <VCardTitle>Manejo de catalogos</VCardTitle>
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <AppAutocomplete
            v-model="data.puesto_id"
            :items="catalogos.puestos"
            :rules="[requiredValidator]"
            label="Puesto"
            placeholder="Seleccione una opción..."
            item-title="nombre"
            item-value="id"
            clearable
            eager
          />
        </VCol>

        <VCol
          cols="6"
          md="6"
        >
          <AppAutocomplete
            v-model="data.unidad_id"
            :items="catalogos.unidades"
            :rules="[requiredValidator]"
            label="Unidad"
            placeholder="Seleccione una opción..."
            item-title="nombre"
            item-value="id"
            clearable
            eager
          />
        </VCol>
      </VRow>
    </VCardText>
  </VCard>

  <VCard class="mb-5">
    <VCardText>
      <EjemploDataTable />

      />
    </VCardText>
  </VCard>

  <VCard class="mb-12">
    <VCardTitle>File input</VCardTitle>
    <VCardText>
      <FileInput
        label-idle="Arrastra y suelta tus archivos aquí o haz clic para seleccionarlos"
        :credits="false"
        allowMultiple
        max-files="2"
        name="documentos"
      />
    </VCardText>
  </VCard>
  <VCard class="mb-12">
    <VCardTitle>Notificación de correo</VCardTitle>
    <VCardText>
      <NotificacionCorreo />
    </VCardText>
  </vcard>
</template>

<style lang="scss" scoped>

</style>
