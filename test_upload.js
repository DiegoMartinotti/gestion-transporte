const puppeteer = require('puppeteer');
const path = require('path');

async function testUpload() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navegar a la página
    await page.goto('http://localhost:3000/viajes');
    
    // Esperar a que cargue la página
    await page.waitForSelector('button[text="Importar"]', { visible: true });
    
    // Hacer clic en Importar
    await page.click('button[text="Importar"]');
    
    // Esperar a que aparezca el modal
    await page.waitForSelector('input[type="file"]', { visible: true });
    
    // Subir el archivo
    const filePath = path.join(__dirname, 'ejemplos', 'plantilla_viajes.xlsx');
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(filePath);
    
    // Esperar a que se procese
    await page.waitForTimeout(2000);
    
    console.log('Archivo subido exitosamente');
    
    await browser.close();
}

testUpload().catch(console.error);