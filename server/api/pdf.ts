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
  try {

    const body = (await readBody(event)) as RequestBody;
    const data = body.data || [];

    if (!data.length) {
      throw new Error('Faltan datos para generar el PDF');
    }

    const logoPath: string = path.resolve(process.cwd(), 'public', 'guayacan_logo.svg');
    const logoBase64: string = fs.readFileSync(logoPath, 'base64');
    const logoSrc: string = `data:image/svg+xml;base64,${logoBase64}`;

    const templatePath: string = path.resolve(process.cwd(), 'assets/plantillasPdf/DataTable.html');
    const htmlContent: string = fs.readFileSync(templatePath, 'utf-8');

    const headers: string[] = Object.keys(data[0]);
    const tableHeaders: string = headers.map((header) => `<th>${header}</th>`).join('');
    const tableRows: string = data
      .map((row) => {
        return `<tr>${headers.map((header) => `<td>${row[header]}</td>`).join('')}</tr>`;
      })
      .join('');

    const dynamicHtml: string = htmlContent
      .replace('{{ tableRows }}', tableRows)
      .replace('{{ imagen }}', logoSrc)
      .replace('{{ fechaActual }}', `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`)
      .replace('{{ tableHeaders }}', tableHeaders);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(dynamicHtml, {waitUntil: 'networkidle0'});

    const pdf: Buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: true,
    });

    await browser.close();

    setHeader(event, 'Content-Type', 'application/pdf');
    setHeader(event, 'Content-Disposition', 'attachment; filename="reporte.pdf"');
    return pdf;

  } catch (error: unknown) {

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al generar el PDF:', errorMessage);

    return {
      statusCode: 500,
      body: {
        message: 'Ocurrió un error al generar el PDF. Por favor, revisa los datos proporcionados.',
      },
    };
  }
});
