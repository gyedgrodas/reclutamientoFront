<script lang="ts" setup>

</script>

<template>

  <VExpansionPanels class="mb-3">
    <!-- Sección Props -->
    <VExpansionPanel>
      <VExpansionPanelTitle>Props del Componente DataTable</VExpansionPanelTitle>
      <VExpansionPanelText>
        <v-list>
          <v-list-item>
            <span>• <strong>endpoint</strong> (Requerido): Ruta de la API para obtener los datos de la tabla.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>columnas</strong> (Requerido): Define las columnas de la tabla con propiedades como título, clave asociada, y configuración para ordenamiento o exportación.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>cantidadPorPagina</strong> (Opcional): Número inicial de elementos mostrados por página. Valor por defecto: <strong>10</strong>.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>cantidadPorPaginaOpciones</strong> (Opcional): Lista de opciones disponibles para los elementos por página. Valor por defecto: <strong>[10, 20, 30]</strong>.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>botones</strong> (Opcional): Especifica los botones habilitados en la tabla, como exportar a CSV, XLSX, PDF o reiniciar. Valor por defecto: <strong>['csv', 'xlsx', 'pdf', 'reiniciar']</strong>.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>titulo</strong> (Opcional): Título del componente que se muestra como encabezado principal.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>filtros</strong> (Opcional): Objeto que permite enviar parámetros para filtrar los resultados desde la API.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>nombreArchivoExport</strong> (Opcional): Nombre personalizado para los archivos exportados. Valor por defecto: <strong>reporte_data + (timestamp)</strong>.</span>
          </v-list-item>
        </v-list>
      </VExpansionPanelText>
    </VExpansionPanel>

    <!-- Sección Funcionalidades -->
    <VExpansionPanel>
      <VExpansionPanelTitle>Funcionalidades del Componente DataTable</VExpansionPanelTitle>
      <VExpansionPanelText>
        <v-list>
          <v-list-item>
            <span>• <strong>Paginación automática con SSR</strong>: Carga solo los datos necesarios para la página actual, evitando traer grandes volúmenes de datos.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>Ordenamiento dinámico de columnas</strong>: Permite ordenar los datos en cualquier columna habilitada, en orden ascendente o descendente.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>Exportación en múltiples formatos</strong>: Exporta los datos en **CSV**, **XLSX** y **PDF**, con nombres personalizados para los archivos.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>Soporte para filtros dinámicos</strong>: Acepta filtros personalizados enviados al servidor para limitar los resultados según criterios específicos.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>Carga de datos asincrónica</strong>: Solicita datos de la API de manera eficiente y gestiona el estado de carga con indicadores visuales.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>Opciones configurables de elementos por página</strong>: Define el número inicial de elementos por página y opciones personalizables para el usuario.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>Renderizado personalizable con slots</strong>: Permite añadir contenido dinámico en columnas o acciones personalizadas por fila.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>Gestión de errores</strong>: Notifica problemas en las solicitudes al servidor con mensajes claros.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>Botones personalizables</strong>: Configura botones como exportar en diferentes formatos o reiniciar según las necesidades del proyecto.</span>
          </v-list-item>
          <v-list-item>
            <span>• <strong>Interfaz responsiva</strong>: Totalmente adaptada a dispositivos móviles, tablets y pantallas grandes usando Vuetify.</span>
          </v-list-item>
        </v-list>
      </VExpansionPanelText>
    </VExpansionPanel>
  </VExpansionPanels>

</template>

<style lang="scss" scoped>

</style>
