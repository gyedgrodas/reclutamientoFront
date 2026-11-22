import { can } from '@layouts/plugins/casl'
import type { SolicitudVacante } from '@/types/reclutamiento'

interface UsuarioResolucion {
  id: number | string
  roles?: (string | { name: string })[]
}

export const usePuedeResolverSolicitud = () => {
  const usuario = useSanctumUser<UsuarioResolucion>()

  return (solicitud: SolicitudVacante | null | undefined): boolean => {
    if (!solicitud || !usuario.value)
      return false

    return solicitud.estado === 'Pendiente'
      && Number(solicitud.solicitante_id) !== Number(usuario.value.id)
      && usuario.value.roles?.some(rol => (typeof rol === 'string' ? rol : rol.name) === 'reclutamiento-aprobador') === true
      && can('resolver solicitudes vacante', 'SolicitudVacante')
  }
}
