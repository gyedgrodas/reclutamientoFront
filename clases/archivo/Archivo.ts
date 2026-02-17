import { renderAsync } from "docx-preview";
export class Archivo {
  id: string
  nombre: string
  tipo: string
  tamaño: number
  file?: File
  url: string | null = null
  remoto: boolean = false

  urlPrevisualizacion: null
  urlPrevisualizacionModal: null

  constructor(archivoODatos: File | { id: string; url: string, tipo: string, nombre: string }) {
    if (archivoODatos instanceof File) {
      this.id = crypto.randomUUID()
      this.nombre = archivoODatos.name
      this.tipo = archivoODatos.type
      this.tamaño = archivoODatos.size
      this.file = archivoODatos
    } else {
      this.id = archivoODatos.id
      this.url = archivoODatos.original_url
      this.nombre = archivoODatos.name
      this.tipo = archivoODatos.mime_type
      this.tamaño = 0
      this.remoto = true
      this.urlPrevisualizacion = archivoODatos.original_url
    }
  }

  esImagen(): boolean {
    return (
      this.tipo === 'image/jpeg' ||
      this.tipo === 'image/png' ||
      this.tipo === 'image/gif' ||
      this.tipo === 'image/webp' ||
      this.tipo === 'image/svg+xml'
    )
  }


  esPdf(): boolean {
    return this.tipo === 'application/pdf'
  }

  esWord(): boolean {
    return [
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-word.document.macroEnabled.12', // .docm
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template', // .dotx
      'application/vnd.ms-word.template.macroEnabled.12', // .dotm
    ].includes(this.tipo)
  }

  async generarPreview(): Promise<void> {
    if (this.remoto) {
      this.urlPrevisualizacion = this.url
      return
    }

    if (!this.file) return

    if (this.esImagen()) {

      const reader = new FileReader()
      this.urlPrevisualizacion = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(this.file!)
      })
    } else if (this.esPdf()) {
      this.urlPrevisualizacion = URL.createObjectURL(this.file!)
    } else if (this.esWord()) {
      if (!this.urlPrevisualizacion) {
        this.urlPrevisualizacion = await this.generarWordPreview(true);
      }
      if (!this.urlPrevisualizacionModal) {
        this.urlPrevisualizacionModal = await this.generarWordPreview(false);
      }
    }
  }

  private async generarWordPreview(esMiniatura: boolean): Promise<string> {
    if (!this.file) return "";

    const arrayBuffer = await this.file.arrayBuffer();
    const container = document.createElement("div");
    await renderAsync(arrayBuffer, container, null, {
      className: "rendered-docx",
      inWrapper: false,
    });

    if (esMiniatura) {
      const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: #f5f5f5;
          overflow-y: auto;
          overflow-x: hidden;
          height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 10px 0;
        }
        body::-webkit-scrollbar {
          width: 8px;
        }
        body::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        body::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        body::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .container {
          width: 210mm;
          transform: scale(0.28);
          transform-origin: top center;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .rendered-docx {
          padding: 40px;
        }
        .rendered-docx * {
          max-width: 100%;
          box-sizing: border-box;
          color: #222;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="rendered-docx">${container.innerHTML}</div>
      </div>
    </body>
    </html>
  `;
      const blob = new Blob([html], { type: "text/html" });
      return URL.createObjectURL(blob);
    } else {
      const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: #f5f5f5;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100%;
          padding: 20px;
        }
        .rendered-docx {
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          padding: 40px;
          max-width: 850px;
          width: 100%;
          border-radius: 4px;
        }
        .rendered-docx * {
          max-width: 100%;
          box-sizing: border-box;
          color: #222;
        }
      </style>
    </head>
    <body>
      <div class="rendered-docx">${container.innerHTML}</div>
    </body>
    </html>
  `;
      const blob = new Blob([html], { type: "text/html" });
      return URL.createObjectURL(blob);
    }
  }

  obtenerUrlParaModal(): string | null {
    return this.esWord()
      ? this.urlPrevisualizacionModal
      : this.urlPrevisualizacion;
  }
}
