export default function ({ store, redirect }) {
  // Verificar si el token no está presente en el store
  if (!store.state.auth.token)
    return redirect('/login') // Redirigir a la página de login si no hay token

  // Verificar si el usuario tiene el rol 'admin'
  const userRoles = store.state.auth.user ? store.state.auth.user.roles : []

  // Si el usuario no tiene el rol 'admin', redirigir a la página principal
  if (!userRoles.includes('admin'))
    return redirect('/')
}
