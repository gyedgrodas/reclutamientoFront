export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  let origin = getRequestURL(event).origin;

  // Forzar HTTPS en desarrollo si es necesario
  if (origin.startsWith("http://localhost")) {
    origin = origin.replace("http://", "https://");
  }

  const state = Math.random().toString(36).substring(7);

  setCookie(event, "oauth_state", state, {
    httpOnly: true,
    secure: true,
    maxAge: 600,
    sameSite: "lax",
    path: "/",
  });

  const microsoftAuthUrl = new URL(
    `https://login.microsoftonline.com/${config.oauth.microsoft.tenant}/oauth2/v2.0/authorize`,
  );

  microsoftAuthUrl.searchParams.append("client_id", config.oauth.microsoft.clientId);
  microsoftAuthUrl.searchParams.append("response_type", "code");
  microsoftAuthUrl.searchParams.append("redirect_uri", `${origin}/api/microsoft/callback`);
  microsoftAuthUrl.searchParams.append("response_mode", "query");
  microsoftAuthUrl.searchParams.append("scope", "openid profile email User.Read");
  microsoftAuthUrl.searchParams.append("state", state);

  return sendRedirect(event, microsoftAuthUrl.toString());
});
