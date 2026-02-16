
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()

  window.Pusher = Pusher

  const echo = new Echo({
    broadcaster: 'reverb',
    key: runtimeConfig.public.REVERB_APP_KEY,
    wsHost: runtimeConfig.public.REVERB_HOST,
    wsPort: runtimeConfig.public.REVERB_PORT || 80,
    wssPort: runtimeConfig.public.REVERB_PORT || 443,
    wsPath: "/ws",
    forceTLS: runtimeConfig.public.REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
  })

  return {
    provide: {
      echo
    }
  }
})
