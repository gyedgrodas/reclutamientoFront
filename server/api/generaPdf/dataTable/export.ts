import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import {H3Event} from 'h3';

// Tipos personalizados
interface RequestBody {
  data: Record<string, any>[];
}

interface ErrorResponse {
  statusCode: number;
  body: {
    message: string;
  };
}

export default defineEventHandler(async (event: H3Event): Promise<Buffer | ErrorResponse> => {
  let browser: puppeteer.Browser | null = null;

  try {
    // Leer el cuerpo de la solicitud
    const body = (await readBody(event)) as RequestBody;
    const data = Array.isArray(body.data) ? body.data : [];

    if (!data.length) {
      throw new Error('Faltan datos para generar el PDF');
    }

    // Cargar el logo como base64
    const logoSrc = getLogoBase64();

    // Cargar y preparar el contenido HTML
    const htmlContent = getHtmlTemplate(data, logoSrc);

    // Inicializar Puppeteer
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Configurar el contenido de la página
    await page.setContent(htmlContent, {waitUntil: 'networkidle0'});

    // Generar el PDF
    const pdf: Buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: true,
    });

    // Cerrar el navegador
    await browser.close();

    // Configurar encabezados y devolver el PDF
    setHeader(event, 'Content-Type', 'application/pdf');
    setHeader(event, 'Content-Disposition', 'attachment; filename="reporte.pdf"');
    return pdf;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al generar el PDF:', errorMessage);

    // Asegurar el cierre del navegador si ocurre un error
    if (browser) await browser.close();

    return {
      statusCode: 500,
      body: {
        message: `Error al generar el PDF: ${errorMessage}`,
      },
    };
  }
});

// Función para obtener el logo en formato base64
function getLogoBase64(): string {
  const logoPath = path.resolve(process.cwd(), 'public', 'guayacan_logo.svg');
  return `data:image/svg+xml;base64,${fs.readFileSync(logoPath, 'base64')}`;
}

// Función para generar el contenido HTML dinámico
function getHtmlTemplate(data: Record<string, any>[], logoSrc: string): string {
  const templatePath = path.resolve(process.cwd(), 'assets/plantillasPdf/DataTable.html');
  const htmlContent = fs.readFileSync(templatePath, 'utf-8');

  const headers = Object.keys(data[0]);
  const tableHeaders = headers.map((header) => `<th>${header}</th>`).join('');
  const tableRows = data
    .map((row) => `<tr>${headers.map((header) => `<td>${row[header]}</td>`).join('')}</tr>`)
    .join('');

  return htmlContent
    .replace('{{ tableRows }}', tableRows)
    .replace('{{ imagen }}', logoSrc)
    .replace('{{ fechaActual }}', `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`)
    .replace('{{ tableHeaders }}', tableHeaders);
}
