import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {

    const body = await readBody(event); // E.g., { data: [{ nombre: 'Juan', edad: 25, ciudad: 'Madrid' }, ...] }

    const data = body.data || [];

    // Leer el archivo HTML
    const filePath = path.resolve('assets/plantillasPdf/DataTable.html');
    const htmlContent = fs.readFileSync(filePath, 'utf-8');

    const headers = Object.keys(data[0]);

    const tableHeaders = headers.map((header) => `<th>${header}</th>`).join('');

    let dynamicHtml = htmlContent.replace('{{ tableHeaders }}', tableHeaders);

    const tableRows = data.map((row) => {
        return headers.map((header) => `<td>${row[header]}</td>`).join('');
    }).map((row) => `<tr>${row}</tr>`).join('');

    dynamicHtml = dynamicHtml.replace('{{ tableRows }}', tableRows);

    // Generar el PDF con Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(dynamicHtml);
    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();

    // Retornar el PDF como respuesta
    setHeader(event, 'Content-Type', 'application/pdf');
    setHeader(event, 'Content-Disposition', 'attachment; filename="reporte.pdf"');
    return pdf;
});
