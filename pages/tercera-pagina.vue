<template>
  <div>
    <h1>Página solo para administradores</h1>
    <p>Contenido exclusivo para usuarios con el rol de admin.</p>
  </div>
</template>

<script>
export default {
  middleware: 'auth',  // Usar el middleware de autenticación

  async mounted() {
    // Verificar si el usuario tiene el rol 'admin' usando el store
    const userRoles = this.$store.state.auth.user ? this.$store.state.auth.user.roles : [];

    if (!userRoles.includes('admin')) {
      // Si el usuario no tiene el rol, redirigir a la página principal
      this.$router.push('/');
    }
  }
};
</script>
