interface UsuarioDashboard {
  roles?: (string | { name: string })[]
}

export const useDashboardReclutamiento = () => {
  const usuario = useSanctumUser<UsuarioDashboard>()

  return computed(() => usuario.value?.roles?.some(rol =>
    (typeof rol === 'string' ? rol : rol.name) === 'reclutamiento-reclutador',
  ) === true)
}
