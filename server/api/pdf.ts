import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    try {
        // Leer el cuerpo del evento
        const body = await readBody(event); // { data: [...], user: { nombre, apellido } }
        const data = body.data || [];
        const user = body.user || {};

        // Rutas
        const logoPath = path.resolve(process.cwd(), 'public', 'guayacan_logo.svg');

        const logoBase64 = fs.readFileSync(logoPath, 'base64');
        const logoSrc = `data:image/svg+xml;base64,${logoBase64}`;

        const templatePath = path.resolve(process.cwd(), 'assets/plantillasPdf/DataTable.html');

        // Validación: asegurarse de que existen datos y usuario
        if (!data.length || !user.nombre) {
            throw new Error('Faltan datos o información del usuario para generar el PDF.');
        }

        // Leer y preparar la plantilla HTML
        const htmlContent = fs.readFileSync(templatePath, 'utf-8');

        // Generar headers y filas dinámicamente
        const headers = Object.keys(data[0]);
        const tableHeaders = headers.map((header) => `<th>${header}</th>`).join('');
        const tableRows = data.map((row) => {
            return `<tr>${headers.map((header) => `<td>${row[header]}</td>`).join('')}</tr>`;
        }).join('');

        console.log(logoPath);

        // Reemplazar los placeholders en la plantilla
        const dynamicHtml = htmlContent
            .replace('{{ tableRows }}', tableRows)
            .replace('{{ user }}', `${user.nombre} ${user.apellido}`)
            .replace('{{ imagen }}', logoSrc)
            .replace('{{ fechaActual }}', `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`)
            .replace('{{ tableHeaders }}', tableHeaders);

        // Inicializar Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Configuración para entornos seguros
        });
        const page = await browser.newPage();

        // Cargar contenido HTML dinámico en Puppeteer
        await page.setContent(dynamicHtml, {waitUntil: 'networkidle0'});

        // Generar el PDF
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            landscape: true,
        });

        await browser.close();

        // Retornar el PDF como respuesta
        setHeader(event, 'Content-Type', 'application/pdf');
        setHeader(event, 'Content-Disposition', 'attachment; filename="reporte.pdf"');
        return pdf;

    } catch (error) {
        // Manejo de errores
        console.error('Error al generar el PDF:', error.message);
        return {
            statusCode: 500,
            body: {
                message: 'Ocurrió un error al generar el PDF. Por favor, revisa los datos proporcionados.',
            },
        };
    }
});
