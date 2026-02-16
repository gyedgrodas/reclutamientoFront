interface NotificacionDataInterface {
  titulo: string;
  mensaje: string;
}

export interface NotificacionInterface {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  titulo: string;
  data: NotificacionDataInterface;
  read_at: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
