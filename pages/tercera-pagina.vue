<template>
  <div>
    <h1>Página solo para administradores</h1>
    <p>Contenido exclusivo para usuarios con el rol de admin.</p>
  </div>

  <selector-buscador
    title="Buscar Asociado"
    placeholder="Ingrese el nombre del asociado "
    Endpoint="/api/asociados/buscar/select2/"
    requerido
  ></selector-buscador>


</template>

<script>

</script>
