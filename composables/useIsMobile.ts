import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

export const useIsMobile = () => {
  const { width } = useDisplay()
  const isMobile = ref(width.value <= 768)

  watch(width, (w) => {
    isMobile.value = w <= 768
  })

  return { isMobile }
}
