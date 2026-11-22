interface UsuarioDashboard {
  roles?: (string | { name: string })[]
}

export const useDashboardReclutamiento = () => {
  const usuario = useSanctumUser<UsuarioDashboard>()

  const rolesAutorizados = ['reclutamiento-reclutador', 'admin', 'SuperAdministrador', 'Super Administrador']

  return computed(() => usuario.value?.roles?.some(rol =>
    rolesAutorizados.includes(typeof rol === 'string' ? rol : rol.name),
  ) === true)
}
