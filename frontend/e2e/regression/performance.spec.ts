import { test, expect } from '@playwright/test';

test.describe('Performance - Métricas Post-Refactorización', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('Tiempo de carga inicial del dashboard < 2 segundos', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // El dashboard debe cargar en menos de 2 segundos
    expect(loadTime).toBeLessThan(2000);

    // Verificar que los componentes principales están cargados
    await expect(page.getByText(/bienvenido/i)).toBeVisible();
  });

  test('Tiempo de respuesta de búsqueda < 500ms', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/buscar/i);

    // Medir tiempo de búsqueda
    const startTime = Date.now();
    await searchInput.fill('test');

    // Esperar a que se actualice la tabla
    await page.waitForFunction(
      () => {
        const table = document.querySelector('table');
        return table && !table.classList.contains('loading');
      },
      { timeout: 1000 }
    );

    const searchTime = Date.now() - startTime;

    // La búsqueda debe responder en menos de 500ms
    expect(searchTime).toBeLessThan(500);
  });

  test('Apertura de modales < 200ms', async ({ page }) => {
    await page.goto('/vehiculos');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /nuevo vehículo/i });

    // Medir tiempo de apertura del modal
    const startTime = Date.now();
    await createButton.click();

    // Esperar a que el modal sea visible
    await expect(page.getByRole('dialog')).toBeVisible();

    const modalOpenTime = Date.now() - startTime;

    // El modal debe abrirse en menos de 200ms
    expect(modalOpenTime).toBeLessThan(200);
  });

  test('Cambio entre páginas < 1 segundo', async ({ page }) => {
    const routes = [
      { from: '/dashboard', to: '/clientes' },
      { from: '/clientes', to: '/vehiculos' },
      { from: '/vehiculos', to: '/sites' },
      { from: '/sites', to: '/tramos' },
    ];

    for (const route of routes) {
      await page.goto(route.from);
      await page.waitForLoadState('networkidle');

      const startTime = Date.now();

      // Navegar usando el menú
      const link = page.getByRole('link', { name: new RegExp(route.to.replace('/', ''), 'i') });
      await link.click();

      // Esperar a que la nueva página cargue
      await page.waitForURL(`**${route.to}`);
      await page.waitForLoadState('networkidle');

      const navigationTime = Date.now() - startTime;

      // La navegación debe completarse en menos de 1 segundo
      expect(navigationTime).toBeLessThan(1000);
    }
  });

  test('Renderizado de tablas grandes < 1 segundo', async ({ page }) => {
    await page.goto('/viajes');
    await page.waitForLoadState('networkidle');

    // Medir tiempo de renderizado inicial
    const startTime = Date.now();

    // Esperar a que la tabla se renderice
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();

    const renderTime = Date.now() - startTime;

    // El renderizado debe completarse en menos de 1 segundo
    expect(renderTime).toBeLessThan(1000);
  });

  test('Memoria no aumenta significativamente después de navegación', async ({ page }) => {
    // Habilitar medición de performance
    await page.evaluateOnNewDocument(() => {
      window.memorySnapshots = [];
    });

    const pages = ['/clientes', '/vehiculos', '/sites', '/tramos', '/viajes'];

    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');

      // Tomar snapshot de memoria
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return null;
      });

      if (memoryUsage) {
        await page.evaluate((usage) => {
          window.memorySnapshots.push(usage);
        }, memoryUsage);
      }
    }

    // Verificar que no hay memory leaks significativos
    const snapshots = await page.evaluate(() => window.memorySnapshots);

    if (snapshots.length > 1) {
      const initialMemory = snapshots[0];
      const finalMemory = snapshots[snapshots.length - 1];
      const memoryIncrease = finalMemory - initialMemory;

      // El aumento de memoria no debe ser mayor a 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('Bundle size no excede límites', async ({ page }) => {
    // Este test verifica que los archivos JS no son demasiado grandes
    const resourceSizes: { [key: string]: number } = {};

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.js') && !url.includes('node_modules')) {
        const headers = response.headers();
        const size = headers['content-length'];
        if (size) {
          const fileName = url.split('/').pop() || 'unknown';
          resourceSizes[fileName] = parseInt(size);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verificar tamaños de bundles
    for (const [file, size] of Object.entries(resourceSizes)) {
      // Los chunks no deben exceder 500KB
      if (file.includes('chunk')) {
        expect(size).toBeLessThan(500 * 1024);
      }
      // El bundle principal no debe exceder 1MB
      if (file.includes('main')) {
        expect(size).toBeLessThan(1024 * 1024);
      }
    }
  });

  test('Tiempo de respuesta de API < 500ms', async ({ page }) => {
    const apiResponseTimes: number[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        const timing = response.timing();
        if (timing) {
          apiResponseTimes.push(timing.responseEnd);
        }
      }
    });

    // Navegar a varias páginas para generar llamadas API
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await page.goto('/vehiculos');
    await page.waitForLoadState('networkidle');

    await page.goto('/sites');
    await page.waitForLoadState('networkidle');

    // Verificar tiempos de respuesta
    if (apiResponseTimes.length > 0) {
      const avgResponseTime = apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length;

      // El tiempo promedio de respuesta debe ser menor a 500ms
      expect(avgResponseTime).toBeLessThan(500);
    }
  });

  test('Formularios responden sin lag', async ({ page }) => {
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    const nameInput = page.getByLabel(/nombre/i);

    // Medir tiempo de respuesta al escribir
    const startType = Date.now();
    await nameInput.type('Test Cliente Performance', { delay: 10 });
    const typeTime = Date.now() - startType;

    // El typing no debe tener lag significativo (max 50ms por caracter)
    const expectedTime = 'Test Cliente Performance'.length * 60; // 60ms max por caracter
    expect(typeTime).toBeLessThan(expectedTime);

    // Cancelar
    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Scroll en tablas es fluido', async ({ page }) => {
    await page.goto('/viajes');
    await page.waitForLoadState('networkidle');

    // Medir FPS durante scroll
    const fps = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        let lastTime = performance.now();
        const startTime = performance.now();

        const countFrame = () => {
          frames++;
          const currentTime = performance.now();

          if (currentTime - startTime >= 1000) {
            resolve(frames);
          } else {
            requestAnimationFrame(countFrame);
          }
        };

        requestAnimationFrame(countFrame);

        // Simular scroll
        const table = document.querySelector('table');
        if (table) {
          table.scrollTop += 100;
        }
      });
    });

    // El FPS debe ser mayor a 30 para considerarse fluido
    expect(fps).toBeGreaterThan(30);
  });
});
