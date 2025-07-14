// Archivo de prueba para verificar que la aplicación funciona correctamente
const puppeteer = require('puppeteer');

async function testViajesPage() {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navegar a la página principal
    await page.goto('http://localhost:3000');
    
    // Esperar a que cargue la página
    await page.waitForTimeout(3000);
    
    // Intentar navegar a la página de viajes
    await page.goto('http://localhost:3000/viajes');
    
    // Esperar a que cargue la página de viajes
    await page.waitForTimeout(5000);
    
    // Capturar errores de la consola
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    // Verificar si hay viajes en la página
    const viajesCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });
    
    console.log(`Número de viajes encontrados: ${viajesCount}`);
    console.log('Logs de consola:', logs);
    
    // Tomar screenshot
    await page.screenshot({ path: 'viajes-test.png' });
    
  } catch (error) {
    console.error('Error en la prueba:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testViajesPage();