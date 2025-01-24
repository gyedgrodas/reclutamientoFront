<template>
  <div>
    <h1>Generar PDF de Usuarios</h1>
    <button @click="generarPDF">Generar PDF</button>


    <img alt="Chial" src="../public/guayacan_logo.svg" style="width: 400px">

  </div>
</template>

<script>
export default {
  methods: {
    async generarPDF() {

      const {user} = useSanctumAuth();

      const datos = [
        {nombre: 'Juan', edad: 25, ciudad: 'Madrid'},
        {nombre: 'Ana', edad: 30, ciudad: 'Barcelona'},
        {nombre: 'Luis', edad: 35, ciudad: 'Valencia'},
      ];

      let data = {
        data: datos,
      };

      try {
        // Enviar datos al backend para generar el PDF
        const response = await fetch('/api/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Error al generar el PDF');
        }

        // Descargar el PDF generado
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'reporte.pdf';
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error al generar el PDF:', error);
      }
    },
  },

};
</script>
