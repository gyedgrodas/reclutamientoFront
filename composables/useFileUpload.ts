import { ref } from 'vue'
import type { RespuestaRequest } from '@/types/admin/menuOpciones/types'
import { useApi } from '@/composables/useApi' // Asegúrate de importar correctamente useApi

export function useFileUpload(url: string) {
  const files = ref<File[]>([]) // Lista de archivos en FilePond
  const { post, deleted } = useApi() // Asegúrate de que `get` esté en `useApi()`

  const loadFile = async (source: string, load: any) => {
    fetch(source)
      .then(res => res.blob())
      .then(blob => {
        console.log('blob', blob)

        const file = new File([blob], source.split('/').pop(), { type: blob.type, name: blob.name })

        console.log('file', file)

        load(file)
      })
  }

  // Función para procesar la subida del archivo
  const processFile = async (fieldName: string, file: File, metadata: any, load: (id: string) => void, error: (msg: string) => void) => {
    try {
      const formData = new FormData()

      formData.append(fieldName, file)

      const response = await post<RespuestaRequest>(`${url}`, formData)

      console.log('Respuesta:', response)

      if (!response || !response.data?.id)
        throw new Error('No se recibió un ID válido')

      console.log('Archivo subido correctamente:', response.data.id)

      load(response.data.id) // FilePond necesita un ID único para manejar el archivo
    }
    catch (err) {
      console.error('Error al subir archivo:', err)
      error('No se pudo subir el archivo') // Notificar error en FilePond
    }
  }

  // Función para revertir (eliminar) un archivo
  const revertFile = async (uniqueFileId: string, load: () => void, error: (msg: string) => void) => {
    try {
      const response = await deleted<RespuestaRequest>(`${url}/${uniqueFileId}`)

      console.log('Respuesta:', response.message)
      load() // Notificar a FilePond que se eliminó correctamente
    }
    catch (err) {
      console.error('Error al eliminar archivo:', err)
      error('No se pudo eliminar el archivo')
    }
  }

  return {
    files,
    serverConfig: {
      process: processFile,
      revert: revertFile,
      load: loadFile, // Agregar la función `load`
    },
  }
}
