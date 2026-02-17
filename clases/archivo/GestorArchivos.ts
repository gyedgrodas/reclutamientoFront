// clases/archivo/GestorDeArchivos.ts
import { ref, Ref } from 'vue'
import { Archivo } from './Archivo'

export class GestorDeArchivos {
  archivos: Ref<Archivo[]> = ref([])
  multiple: boolean

  constructor(multiple = true) {
    this.multiple = multiple
  }

  async agregar(nuevos: File[] | { id: string; url: string }[]) {
    const archivosNuevos = Array.isArray(nuevos) ? nuevos : [nuevos]
    if (!this.multiple)
      this.limpiar()

    for (const raw of archivosNuevos) {
      const archivo = new Archivo(raw)

        if (raw instanceof File)
          await archivo.generarPreview()

        this.archivos.value.push(archivo)
    }
  }

  eliminarPorId(id: string) {
    const index = this.archivos.value.findIndex(a => a.id === id)
    if (index !== -1) {
      this.archivos.value[index].revocarPreview?.() // 👈 por si tiene blob
      this.archivos.value.splice(index, 1)
    }
  }

  limpiar() {
    this.archivos.value.forEach(a => a.revocarPreview?.())
    this.archivos.value = []
  }
}
