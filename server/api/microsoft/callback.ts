export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  // Validar state
  const savedState = getCookie(event, 'oauth_state')

  if (!savedState || savedState !== query.state)
    return sendRedirect(event, '/login?error=invalid_state')

  deleteCookie(event, 'oauth_state')

  if (query.error)
    return sendRedirect(event, `/login?error=${query.error}`)

  const code = query.code as string
  if (!code)
    return sendRedirect(event, '/login?error=no_code')

  try {
    let origin = getRequestURL(event).origin

    // if (origin.startsWith('http://localhost'))
    //   origin = origin.replace('http://', 'https://');

    const redirectUri = `${origin}/api/microsoft/callback`

    const tokenResponse: any = await $fetch(
      `https://login.microsoftonline.com/${config.oauth.microsoft.tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: config.oauth.microsoft.clientId,
          client_secret: config.oauth.microsoft.clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      },
    );

    // Obtener información del usuario de Microsoft
    const userInfo: any = await $fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    });

    // Autenticar con Laravel
    const laravelAuth: any = await $fetch(
      `${config.public.apiBaseUrl}/api/auth/microsoft/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: {
          email: userInfo.mail || userInfo.userPrincipalName,
          name: userInfo.displayName,
          microsoft_id: userInfo.id,
        },
      },
    );

    const token = laravelAuth.data?.token || laravelAuth.token || laravelAuth.data;

    if (!token) {
      return sendRedirect(event, "/login?error=no_token_from_laravel");
    }

    return sendRedirect(event, `/login?token=${token}`);

  } catch (error: any) {
    console.error("Error en autenticación Microsoft:", error);
    return sendRedirect(event, "/login?error=auth_failed");
  }
});
