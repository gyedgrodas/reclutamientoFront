// =================================================================
// 🧠 MEMORIA DEL SERVIDOR
// =================================================================
const deviceLimitMap = new Map();

// CONFIGURACIÓN
const WINDOW_MS = 60 * 1000; // Ventana de tiempo: 1 minuto
const MAX_ATTEMPTS = 5;      // ⚠️ Límite estricto: 5 intentos por dispositivo

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl = config.public.apiBaseUrl;
  const allowedOrigin = config.public.appUrl.replace(/\/$/, "");
  const isProduction = config.public.entorno === 'production';
  const targetPath = event.path.replace(/^\/services/, "");
  const targetPathLower = targetPath.toLowerCase();

  // =================================================================
  // 🛡️ CAPA 1: VALIDACIÓN DE ORIGEN
  // =================================================================
  if (isProduction) {
    const origin = getHeader(event, "origin");
    const referer = getHeader(event, "referer");
    const sourceOrigin = origin || (referer ? new URL(referer).origin : null);
    const cleanSourceOrigin = sourceOrigin?.replace(/\/$/, "");

    if (!cleanSourceOrigin || cleanSourceOrigin !== allowedOrigin) {
      setResponseStatus(event, 403);
      return { error: "Origen no permitido." };
    }
  }

  // =================================================================
  // 🛡️ CAPA 2: BLOQUEO POR DISPOSITIVO (Rate Limiter)
  // =================================================================
  // Solo aplicamos esto en el login
  if (targetPathLower.includes("/login")) {

    // 1. Obtenemos el ID único que manda tu Frontend
    const deviceId = getHeader(event, "x-device-id");

    // 2. Si no trae ID, es sospechoso (bot o acceso directo) -> Rechazamos
    if (!deviceId) {
      setResponseStatus(event, 400); // Bad Request
      return { message: "Falta identificador de seguridad del dispositivo." };
    }

    const currentTime = Date.now();

    // 3. Buscamos en memoria si este dispositivo ya intentó
    const deviceData = deviceLimitMap.get(deviceId) || { count: 0, startTime: currentTime };

    // Si ya pasó 1 minuto desde el primer intento, reseteamos el contador a 0
    if (currentTime - deviceData.startTime > WINDOW_MS) {
      deviceData.count = 0;
      deviceData.startTime = currentTime;
    }

    // Aumentamos el contador
    deviceData.count++;
    deviceLimitMap.set(deviceId, deviceData);

    // 4. 🚫 BLOQUEO: Si supera 5 intentos -> ERROR 429
    if (deviceData.count > MAX_ATTEMPTS) {
      setResponseStatus(event, 429);

      // Limpieza preventiva: si el mapa crece demasiado (ataque masivo de IDs random), lo vaciamos
      if(deviceLimitMap.size > 20000) deviceLimitMap.clear();

      return {
        message: "Dispositivo bloqueado temporalmente por demasiados intentos fallidos.",
        retry_after: 60 // Segundos sugeridos
      };
    }
  }

  // =================================================================
  // 🛡️ CAPA 3: ANTI-BOTS (User Agent)
  // =================================================================
  const userAgent = getHeader(event, "user-agent") || "";
  if (userAgent.includes("curl") || userAgent.includes("wget")) {
    setResponseStatus(event, 403);
    return { error: "User agent no permitido" };
  }

  // =================================================================
  // 🛡️ CAPA 4: PRE-VALIDACIÓN TOKEN
  // =================================================================
  const isPublicRoute =
    targetPathLower.includes("/login") ||
    targetPathLower.includes("/portal") ||
    targetPathLower.includes("/publico") ||
    targetPathLower.includes("/sanctum/csrf-cookie") ||
    targetPathLower.includes("/storage");

  const authHeader = getHeader(event, "authorization");

  if (!authHeader && !isPublicRoute) {
    setResponseStatus(event, 401);
    return { error: "No autorizado" };
  }

  // =================================================================
  // 📡 PROXY
  // =================================================================
  const forwarded = getHeader(event, "x-forwarded-for");
  const clientIp = forwarded?.split(',')[0].trim() || event.node.req.socket?.remoteAddress || '';
  const deviceId = getHeader(event, "x-device-id"); // Recuperamos de nuevo para enviarlo

  return proxyRequest(event, `${backendUrl}${targetPath}`, {
    headers: {
      'x-forwarded-for': clientIp,
      'x-real-ip': clientIp,
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      ...(authHeader ? { 'Authorization': authHeader } : {}),
      // Reenviamos el ID a Laravel por si quieres guardar logs allá
      'X-Device-Id': deviceId || 'unknown'
    },
    ...( !isProduction ? { fetchOptions: { ignoreResponseError: true } } : {} )
  });
})
