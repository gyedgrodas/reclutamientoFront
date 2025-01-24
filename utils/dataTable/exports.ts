import * as XLSX from 'xlsx';

/**
 * Exporta un array de objetos a un archivo XLSX
 * @param {Array} data - Array de objetos (e.g., [{ nombre: 'Juan', edad: 25 }, ...])
 * @param {string} filename - Nombre del archivo de salida (e.g., 'datos.xlsx')
 */
export function exportarDataFormatoXLSX(data, filename = 'archivo.xlsx') {

  if (Array.isArray(data) || data.length > 0) {

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    if (filename.indexOf('.xlsx') === -1) {
      filename += '.xlsx';
    }

    XLSX.writeFile(workbook, filename);

  }

  console.error('El array de datos está vacío o no es válido.');

}

/**
 * Exporta un array de objetos a un archivo CSV
 * @param {Array} data - Array de objetos (e.g., [{ nombre: 'Juan', edad: 25 }, ...])
 * @param {string} filename - Nombre del archivo de salida (e.g., 'datos.csv')
 */
export function exportarDataFormatoCSV(data, filename = 'archivo.csv') {

  if (Array.isArray(data) || data.length > 0) {

    const worksheet = XLSX.utils.json_to_sheet(data);

    const csvData = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvData], {type: 'text/csv;charset=utf-8;'});
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  }

  console.error('El array de datos está vacío o no es válido.');

}

/**
 * Exporta un array de objetos a un archivo PDF
 * @param {Array} data - Array de objetos (e.g., [{ nombre: 'Juan', edad: 25 }, ...])
 * @param {string} filename - Nombre del archivo de salida (e.g., 'datos.csv')
 */
export async function exportarDataFormatoPDF(data, filename = 'archivo.pdf') {

  try {

    const response = await fetch('/api/generaPdf/exportDataTable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({data}),
    });

    if (!response.ok) {
      throw new Error('Error al generar el PDF');
    }

    if (filename.indexOf('.pdf') === -1) {
      filename += '.pdf';
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

  } catch (error) {

    console.error('Error al generar el PDF:', error);

  }

}


