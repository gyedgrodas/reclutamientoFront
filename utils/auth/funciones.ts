/**
 * Función para autenticar al usuario
 * @param token De tipo String
 */
export const autenticar = async (token: string, cliente_token?: string) => {
  try {
    const { refreshIdentity } = useSanctumAuth()

    const isSecure = <boolean>useRequestURL().protocol.startsWith('https')

    const cookie = useCookie<string>('sanctum.token.cookie', { secure: isSecure })
    const cookieCliente = useCookie<string>('autorizacion', { secure: isSecure })

    cookie.value = token
    if (cliente_token)
      cookieCliente.value = cliente_token

    await refreshIdentity()

    navigateTo('/')
  }
  catch (error) {
    console.error(error)

    navigateTo('/login')
  }
}
