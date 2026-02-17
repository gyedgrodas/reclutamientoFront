/**
 * Genera un UUID v4 compatible con cualquier entorno (HTTP/HTTPS/Legacy)
 */
export const generateUUID = (): string => {
  // 1. INTENTO MODERNO (Solo funciona en HTTPS/Localhost)
  if (typeof self !== 'undefined' && self.crypto && typeof self.crypto.randomUUID === 'function') {
    try {
      return self.crypto.randomUUID()
    } catch (e) {
      // Si falla, continuamos al plan B
    }
  }

  // 2. PLAN B: Generación manual (Funciona siempre)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
