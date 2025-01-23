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

