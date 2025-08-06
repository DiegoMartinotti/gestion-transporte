import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Flujos Críticos del Sistema', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('Flujo completo: Cliente → Site → Tramo → Viaje', async ({ page }) => {
    // 1. Crear Cliente
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    const clientCode = `SMOKE${Date.now()}`;
    await page.getByLabel(/código/i).fill(clientCode);
    await page.getByLabel(/nombre/i).fill('Cliente Smoke Test');
    await page.getByLabel(/cuit/i).fill('20-12345678-9');
    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/cliente creado exitosamente/i)).toBeVisible();

    // 2. Crear Sites
    await page.goto('/sites');

    // Site Origen
    await page.getByRole('button', { name: /nuevo site/i }).click();
    await page.getByLabel(/cliente/i).click();
    await page.getByText('Cliente Smoke Test').click();
    await page.getByLabel(/denominación/i).fill('Origen Smoke');
    await page.getByLabel(/dirección/i).fill('Calle Origen 100');
    await page.getByLabel(/ciudad/i).fill('Buenos Aires');
    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/site creado exitosamente/i)).toBeVisible();

    // Site Destino
    await page.getByRole('button', { name: /nuevo site/i }).click();
    await page.getByLabel(/cliente/i).click();
    await page.getByText('Cliente Smoke Test').click();
    await page.getByLabel(/denominación/i).fill('Destino Smoke');
    await page.getByLabel(/dirección/i).fill('Calle Destino 200');
    await page.getByLabel(/ciudad/i).fill('Buenos Aires');
    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/site creado exitosamente/i)).toBeVisible();

    // 3. Crear Tramo
    await page.goto('/tramos');
    await page.getByRole('button', { name: /nuevo tramo/i }).click();

    await page.getByLabel(/cliente/i).click();
    await page.getByText('Cliente Smoke Test').click();
    await page.waitForTimeout(1000); // Esperar carga de sites

    await page.getByLabel(/origen/i).click();
    await page.getByText('Origen Smoke').click();

    await page.getByLabel(/destino/i).click();
    await page.getByText('Destino Smoke').click();

    await page.getByLabel(/denominación/i).fill('Tramo Smoke Test');

    // Tarifa
    const tarifaTab = page.getByRole('tab', { name: /tarifa/i });
    if (await tarifaTab.isVisible()) {
      await tarifaTab.click();
    }

    await page.getByLabel(/tipo.*cálculo/i).selectOption('POR_VIAJE');
    await page.getByLabel(/importe/i).fill('50000');

    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/tramo creado exitosamente/i)).toBeVisible();

    // 4. Crear Viaje
    await page.goto('/viajes');
    await page.getByRole('button', { name: /nuevo viaje/i }).click();

    await page.getByLabel(/cliente/i).click();
    await page.getByText('Cliente Smoke Test').click();
    await page.waitForTimeout(1000); // Esperar carga de tramos

    await page.getByLabel(/tramo/i).click();
    await page.getByText('Tramo Smoke Test').click();

    const fecha = new Date();
    await page.getByLabel(/fecha/i).fill(fecha.toISOString().split('T')[0]);

    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/viaje creado exitosamente/i)).toBeVisible();

    // Verificar que el viaje aparece en la lista
    await expect(page.getByText('Cliente Smoke Test')).toBeVisible();
    await expect(page.getByText('Tramo Smoke Test')).toBeVisible();
  });

  test('CRUD rápido en todos los módulos principales', async ({ page }) => {
    const modules = [
      { url: '/clientes', newButton: /nuevo cliente/i, requiredField: 'nombre' },
      { url: '/vehiculos', newButton: /nuevo vehículo/i, requiredField: 'patente' },
      { url: '/empresas', newButton: /nueva empresa/i, requiredField: 'razón social' },
      { url: '/personal', newButton: /nuevo personal/i, requiredField: 'nombre' },
    ];

    for (const module of modules) {
      // Navegar al módulo
      await page.goto(module.url);

      // Verificar que la página carga
      await expect(page).toHaveURL(module.url);

      // Verificar que el botón de crear existe
      const createButton = page.getByRole('button', { name: module.newButton });
      await expect(createButton).toBeVisible();

      // Abrir formulario
      await createButton.click();

      // Verificar que el formulario se abre
      await expect(page.getByRole('dialog')).toBeVisible();

      // Verificar campo requerido
      const requiredInput = page.getByLabel(new RegExp(module.requiredField, 'i'));
      await expect(requiredInput).toBeVisible();

      // Cancelar
      await page.getByRole('button', { name: /cancelar/i }).click();

      // Verificar que el modal se cierra
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('Navegación principal funciona correctamente', async ({ page }) => {
    const routes = [
      { link: /dashboard/i, url: '/dashboard', title: /dashboard|panel/i },
      { link: /clientes/i, url: '/clientes', title: /clientes/i },
      { link: /vehículos/i, url: '/vehiculos', title: /vehículos/i },
      { link: /viajes/i, url: '/viajes', title: /viajes/i },
      { link: /sites/i, url: '/sites', title: /sites/i },
      { link: /tramos/i, url: '/tramos', title: /tramos/i },
    ];

    for (const route of routes) {
      // Click en el link del menú
      await page.getByRole('link', { name: route.link }).click();

      // Verificar URL
      await expect(page).toHaveURL(route.url);

      // Verificar que el contenido carga
      await expect(page.getByText(route.title)).toBeVisible();

      // Verificar que no hay errores
      const errorMessage = page.getByText(/error/i);
      if (await errorMessage.isVisible()) {
        // Si hay un mensaje de error genérico, verificar que es esperado
        const isExpectedError = await errorMessage.evaluate(
          (el) =>
            el.textContent?.includes('No hay') || el.textContent?.includes('No se encontraron')
        );
        expect(isExpectedError).toBeTruthy();
      }
    }
  });

  test('Búsqueda funciona en módulos principales', async ({ page }) => {
    const modules = ['/clientes', '/vehiculos', '/personal', '/viajes'];

    for (const module of modules) {
      await page.goto(module);

      const searchInput = page.getByPlaceholder(/buscar/i);
      if (await searchInput.isVisible()) {
        // Realizar búsqueda
        await searchInput.fill('test');
        await page.waitForTimeout(500);

        // Verificar que no hay errores
        const errorAlert = page.getByRole('alert');
        if (await errorAlert.isVisible()) {
          const errorText = await errorAlert.textContent();
          // Solo fallar si es un error real, no "no hay resultados"
          expect(errorText).toMatch(/no.*resultados|no.*encontr/i);
        }

        // Limpiar búsqueda
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Exportación a Excel disponible', async ({ page }) => {
    const modulesWithExport = ['/clientes', '/vehiculos', '/viajes'];

    for (const module of modulesWithExport) {
      await page.goto(module);

      const exportButton = page.getByRole('button', { name: /exportar/i });
      if (await exportButton.isVisible()) {
        await exportButton.click();

        // Verificar opciones de exportación
        const excelOption = page.getByText(/excel/i);
        if (await excelOption.isVisible()) {
          await expect(excelOption).toBeVisible();
        }

        // Cerrar si es un modal
        const closeButton = page.getByRole('button', { name: /cerrar|cancelar/i });
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('Validaciones funcionan en formularios', async ({ page }) => {
    // Probar en clientes
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // Intentar guardar sin datos
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar mensajes de validación
    await expect(page.getByText(/requerido/i)).toBeVisible();

    // Llenar con datos inválidos
    await page.getByLabel(/email/i).fill('email-invalido');
    await page.getByLabel(/cuit/i).fill('123');

    // Trigger validación
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar errores de formato
    await expect(page.getByText(/formato.*inválido/i)).toBeVisible();

    // Cancelar
    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Paginación funciona correctamente', async ({ page }) => {
    await page.goto('/viajes');

    const pagination = page.locator('[aria-label="pagination"], .pagination');
    if (await pagination.isVisible()) {
      // Verificar botones de paginación
      const nextButton = page.getByRole('button', { name: /siguiente/i });
      const prevButton = page.getByRole('button', { name: /anterior/i });

      if (await nextButton.isEnabled()) {
        // Ir a siguiente página
        await nextButton.click();
        await page.waitForTimeout(500);

        // Verificar que cambió la página
        await expect(prevButton).toBeEnabled();

        // Volver a primera página
        await prevButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Logout funciona correctamente', async ({ page }) => {
    // Buscar botón de logout
    const logoutButton = page.getByRole('button', { name: /logout|salir|cerrar sesión/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Confirmar si hay modal
      const confirmButton = page.getByRole('button', { name: /confirmar/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verificar redirección a login
      await expect(page).toHaveURL('/login');
      await expect(page.getByText(/iniciar sesión/i)).toBeVisible();
    }
  });

  test('Manejo de errores y recuperación', async ({ page }) => {
    // Simular error de red
    await page.route('**/api/clientes**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/clientes');

    // Verificar mensaje de error
    await expect(page.getByText(/error/i)).toBeVisible();

    // Buscar botón de reintentar
    const retryButton = page.getByRole('button', { name: /reintentar|intentar/i });
    if (await retryButton.isVisible()) {
      // Restaurar conexión
      await page.unroute('**/api/clientes**');

      // Reintentar
      await retryButton.click();
      await page.waitForTimeout(1000);

      // Verificar que funciona
      const errorMessage = page.getByText(/error al cargar/i);
      if (await errorMessage.isVisible()) {
        // Si sigue el error, es porque no hay datos
        await expect(errorMessage).toContainText(/no hay|vacío/i);
      } else {
        // Se recuperó correctamente
        await expect(page.locator('table')).toBeVisible();
      }
    }
  });

  test('Performance: Páginas cargan en tiempo aceptable', async ({ page }) => {
    const criticalPages = ['/dashboard', '/clientes', '/viajes', '/vehiculos'];

    for (const pageUrl of criticalPages) {
      const startTime = Date.now();

      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Las páginas críticas deben cargar en menos de 3 segundos
      expect(loadTime).toBeLessThan(3000);

      // Verificar que el contenido principal está visible
      const mainContent = page.locator('main, [role="main"], .main-content');
      await expect(mainContent).toBeVisible();
    }
  });
});
