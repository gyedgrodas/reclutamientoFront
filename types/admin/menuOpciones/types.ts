export interface MenuOpcion {
  titulo?: string | null;
  icono?: string | null;
  ruta?: string | null;
  titulo_seccion?: string | null;
  parent_id?: number | null;
  action?: string | null;
  subject?: string | null;
}


export interface RespuestaRequest {
  success: 'true' | 'false';
  message: string;
  data: [] | object | null;
}
