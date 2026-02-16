import { PROGRAMADOR_TEXT } from '@/constantes/admin/modulo-usuarios/Const-Roles'
import type { UsuarioInterface } from '@/types/usuarios'
import { format } from "date-fns";
import { ESTADOS_FINALIZADOS } from "@/constantes/SolicitudCreditos/Estados";
const { showToastError } = useToast()

/**
 * Función que calcula la diferencia entre dos fechas y retorna un string con la diferencia
 * @param fechaRegistro
 */
export const haceCuantoFueHecha = (fechaRegistro: Date | string): string => {
  // Convertir a Date si es un string
  const fecha: Date = fechaRegistro instanceof Date ? fechaRegistro : new Date(fechaRegistro)

  // Verificar si la fecha es válida
  if (isNaN(fecha.getTime())) {
    return 'Fecha inválida'
  }

  const ahora: Date = new Date()
  const diferenciaMs: number = ahora.getTime() - fecha.getTime()

  // Constantes para convertir milisegundos
  const segundoMs = 1000
  const minutoMs = segundoMs * 60
  const horaMs = minutoMs * 60
  const diaMs = horaMs * 24
  const mesMs = diaMs * 30 // Aproximación
  const anioMs = mesMs * 12 // Aproximación

  // Cálculo de cada unidad de tiempo
  const años = Math.floor(diferenciaMs / anioMs)
  const restoAnio = diferenciaMs % anioMs

  const meses = Math.floor(restoAnio / mesMs)
  const restoMes = restoAnio % mesMs

  const dias = Math.floor(restoMes / diaMs)
  const restoDia = restoMes % diaMs

  const horas = Math.floor(restoDia / horaMs)
  const restoHora = restoDia % horaMs

  const minutos = Math.floor(restoHora / minutoMs)
  const restoMinuto = restoHora % minutoMs

  const segundos = Math.floor(restoMinuto / segundoMs)

  // Armamos un arreglo con las partes no nulas
  const partes: string[] = []
  if (años > 0) {
    partes.push(`${años} año${años > 1 ? 's' : ''}`)
  }
  if (meses > 0) {
    partes.push(`${meses} mes${meses > 1 ? 'es' : ''}`)
  }
  if (dias > 0) {
    partes.push(`${dias} día${dias > 1 ? 's' : ''}`)
  }
  if (horas > 0) {
    partes.push(`${horas} hora${horas > 1 ? 's' : ''}`)
  }
  if (minutos > 0) {
    partes.push(`${minutos} minuto${minutos > 1 ? 's' : ''}`)
  }
  if (segundos > 0) {
    partes.push(`${segundos} segundo${segundos > 1 ? 's' : ''}`)
  }

  // Si no hay diferencia, retornamos 0 segundos
  if (partes.length === 0) {
    return '0 segundos'
  }

  // Devolvemos las dos unidades más grandes para mayor precisión
  return partes.slice(0, 2).join(', ')
}


/**
 * Función que calcula la diferencia entre dos fechas y retorna un string con la diferencia
 * @param fechaRegistro
 * @param idEstado
 * @param fechaFinalizacion
 */
export const tiempoTranscurridoSolicitud = (
  fechaRegistro: Date | string,
  idEstado?: number, // Ahora es opcional
  fechaFinalizacion?: Date | string | null
): string => {
  // 1. Convertir fecha de inicio
  const fechaInicio: Date = fechaRegistro instanceof Date ? fechaRegistro : new Date(fechaRegistro);

  // 2. Determinar la fecha de fin
  let fechaFin: Date;

  /**
   * Lógica:
   * - Si recibimos un idEstado Y ese estado está en la lista de finalizados
   * Y además tenemos una fechaFinalizacion válida, usamos esa fecha.
   * - En cualquier otro caso (si no hay estado, no es finalizado o no hay fechaFin),
   * usamos la fecha actual (ahora).
   */
  if (idEstado !== undefined && ESTADOS_FINALIZADOS.includes(idEstado) && fechaFinalizacion) {
    fechaFin = fechaFinalizacion instanceof Date ? fechaFinalizacion : new Date(fechaFinalizacion);
  } else {
    fechaFin = new Date();
  }

  // Verificar validez de fechas
  if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
    return 'Fecha inválida';
  }

  const diferenciaMs: number = fechaFin.getTime() - fechaInicio.getTime();

  // Evitar resultados negativos si la fecha de registro es futura
  if (diferenciaMs < 0) return '0 segundos';

  // --- Tu lógica original de cálculos ---
  const segundoMs = 1000;
  const minutoMs = segundoMs * 60;
  const horaMs = minutoMs * 60;
  const diaMs = horaMs * 24;
  const mesMs = diaMs * 30;
  const anioMs = mesMs * 12;

  const años = Math.floor(diferenciaMs / anioMs);
  const restoAnio = diferenciaMs % anioMs;
  const meses = Math.floor(restoAnio / mesMs);
  const restoMes = restoAnio % mesMs;
  const dias = Math.floor(restoMes / diaMs);
  const restoDia = restoMes % diaMs;
  const horas = Math.floor(restoDia / horaMs);
  const restoHora = restoDia % horaMs;
  const minutos = Math.floor(restoHora / minutoMs);
  const restoMinuto = restoHora % minutoMs;
  const segundos = Math.floor(restoMinuto / segundoMs);

  const partes: string[] = [];
  if (años > 0) partes.push(`${años} año${años > 1 ? 's' : ''}`);
  if (meses > 0) partes.push(`${meses} mes${meses > 1 ? 'es' : ''}`);
  if (dias > 0) partes.push(`${dias} día${dias > 1 ? 's' : ''}`);
  if (horas > 0) partes.push(`${horas} hora${horas > 1 ? 's' : ''}`);
  if (minutos > 0) partes.push(`${minutos} minuto${minutos > 1 ? 's' : ''}`);
  if (segundos > 0) partes.push(`${segundos} segundo${segundos > 1 ? 's' : ''}`);

  if (partes.length === 0) return '0 segundos';

  return partes.slice(0, 2).join(', ');
};


export const entornoActual = (): String => {
  return <string>process.env.APP_ENV || 'local';
};

/**
 * Función que formatea un número a moneda
 * @param value
 */
export function formatoDinero(value: number): string {
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}


export function manejaError(error: any): void {
  const { showToastError } = useToast();
  const usuarioAutenticado = useSanctumUser<UsuarioInterface>();
  const esDeveloper = usuarioAutenticado.value?.roles.some((rol) => rol?.toLowerCase() === PROGRAMADOR_TEXT.toLowerCase());
  const codigoEstado = error?.response?.status;

  console.error('Error de la peticion de la base de datos:', error.message);


  if (error.response && error.response.data instanceof Blob) {
    // 1. Convertimos el Blob a texto
    const reader = new FileReader();
    reader.onload = () => {
      const responseData = JSON.parse(reader.result);
      showToastError(responseData.message)
    };
    reader.readAsText(error.response.data);
  }
  else {
    if (codigoEstado && codigoEstado < 500) {
      showToastError(error?.response?.data?.message || 'Error desconocido');
    } else if (codigoEstado && codigoEstado >= 500 || !codigoEstado) {
      // Si el código de estado es mayor o igual a 500 o no tiene código de estado, solo los desarrolladores verán los detalles
      if (esDeveloper) {
        console.error('Error:', error); // Mostrar detalles del error solo a los desarrolladores
        showToastError(error?.response?.data?.message || 'Error desconocido');
      } else {
        showToastError('Ha ocurrido un error interno. Por favor, contacta al administrador.');
      }
    }
  }
}

/**
 * Función que verifica si una variable tiene datos
 * @param variable
 */
export function tieneDatos(variable: any): boolean {
  if (variable === null || variable === undefined) {
    return false;
  }

  if (typeof variable === 'string') {
    return variable.trim() !== '';
  }

  if (Array.isArray(variable)) {
    const filtrado = variable.filter(v => tieneDatos(v));
    return filtrado.length > 0;
  }

  if (typeof variable === 'object') {
    const keys = Object.keys(variable);
    if (keys.length === 0) {
      return false;
    }

    return keys.some(key => tieneDatos(variable[key]));
  }

  return true;
}

/**
 * Función que formatea la fecha para un input
 * @param fecha
 */
export function formatearFechaInput(fecha: Date | string): string {
  if (fecha instanceof Date) {
    return fecha.toISOString().split('T')[0];
  }
  return fecha.split('T')[0];
}

/**
 * Función para formater fecha para la vista dd-mm-yyyy
 * @param str
 */
export function formatearFecha(fecha: string | Date): string {
  return format(new Date(fecha), "dd-MM-yyyy")
}

/**
 * Funcion para mostrar la fecha con los minutos y segundos
 * @param error
 */
export function formatoFechaHora(fecha: string | Date): string {
  return format(new Date(fecha), "dd-MM-yyyy HH:mm:ss")
}

export const mostrarError = async (error: any): Promise<void> => {
  const response = error?.response;

  if (!response) {
    showToastError("Error inesperado");
    return;
  }

  const status = response.status as number;
  let mensajeError = "";

  /* ───────── 404 ───────── */
  if (status === 404) {
    mensajeError =
      response.data?.message ?? "Recurso no encontrado en el servidor";
    showToastError(mensajeError);
    return;
  }

  /* ───────── 422 ───────── */
  if (status === 422) {
    const bag = response.data?.errors ?? null; // formato “correcto”

    if (bag && typeof bag === "object") {
      const mensajes: string[] = Object.values(bag).flat() as string[];
      mensajes.forEach(showToastError);
    }
    return;
  }

  /* ───────── 403 ───────── */
  if (status === 403) {
    mensajeError =
      response.data?.message ?? "No tienes permiso para realizar esta acción";
    showToastError(mensajeError);
    await navigateTo({
      path: "/",
      replace: true,
    });
    return;
  }

  mensajeError = response.data?.message ?? "Error en la respuesta del servidor";
  showToastError(mensajeError);
};


