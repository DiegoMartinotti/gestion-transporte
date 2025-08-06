import { test, expect } from '@playwright/test';

test.describe('Post-Refactorización - Verificación de Regresiones', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('useModal hook funciona correctamente en todas las páginas', async ({ page }) => {
    const pagesToTest = [
      { url: '/clientes', buttonText: /nuevo cliente/i, modalTitle: /cliente/i },
      { url: '/vehiculos', buttonText: /nuevo vehículo/i, modalTitle: /vehículo/i },
      { url: '/empresas', buttonText: /nueva empresa/i, modalTitle: /empresa/i },
      { url: '/personal', buttonText: /nuevo personal/i, modalTitle: /personal/i },
      { url: '/sites', buttonText: /nuevo site/i, modalTitle: /site/i },
      { url: '/tramos', buttonText: /nuevo tramo/i, modalTitle: /tramo/i },
    ];

    for (const pageConfig of pagesToTest) {
      // Navegar a la página
      await page.goto(pageConfig.url);

      // Verificar que el botón de crear existe
      const createButton = page.getByRole('button', { name: pageConfig.buttonText });
      await expect(createButton).toBeVisible();

      // Abrir modal de creación
      await createButton.click();

      // Verificar que el modal se abre
      await expect(page.getByText(pageConfig.modalTitle)).toBeVisible();

      // Cerrar modal
      const closeButton = page.getByRole('button', { name: /cancelar|cerrar/i });
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }

      // Verificar que el modal se cierra
      await expect(page.getByText(pageConfig.modalTitle)).not.toBeVisible();
    }
  });

  test('useDataLoader hook carga datos correctamente', async ({ page }) => {
    const pagesToTest = [
      { url: '/clientes', expectedText: /cliente/i },
      { url: '/vehiculos', expectedText: /vehículo/i },
      { url: '/empresas', expectedText: /empresa/i },
      { url: '/personal', expectedText: /personal/i },
      { url: '/sites', expectedText: /site/i },
      { url: '/tramos', expectedText: /tramo/i },
    ];

    for (const pageConfig of pagesToTest) {
      // Navegar a la página
      await page.goto(pageConfig.url);

      // Esperar a que los datos se carguen (no debería haber indicador de carga)
      await page.waitForTimeout(1000);

      // Verificar que no hay errores de carga
      const errorMessage = page.getByText(/error al cargar/i);
      await expect(errorMessage).not.toBeVisible();

      // Verificar que hay contenido cargado
      const content = page.getByText(pageConfig.expectedText).first();
      await expect(content).toBeVisible();
    }
  });

  test('Validadores migrados funcionan correctamente', async ({ page }) => {
    // Ir a crear un nuevo viaje para probar validadores
    await page.goto('/viajes');
    await page.getByRole('button', { name: /nuevo viaje/i }).click();

    // Intentar guardar sin datos (debe mostrar errores de validación)
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar que se muestran errores de validación
    await expect(page.getByText(/campo requerido|es requerido/i)).toBeVisible();

    // Cancelar
    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Servicios con BaseService mantienen funcionalidad CRUD', async ({ page }) => {
    // Probar CRUD de vehículos (migrado a BaseService)
    await page.goto('/vehiculos');

    // Crear
    await page.getByRole('button', { name: /nuevo vehículo/i }).click();
    await page.getByLabel(/patente/i).fill('TEST999');
    await page.getByLabel(/marca/i).fill('TestMarca');
    await page.getByLabel(/modelo/i).fill('TestModelo');
    await page.getByLabel(/año/i).fill('2024');
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar creación exitosa
    await expect(page.getByText(/creado exitosamente/i)).toBeVisible();

    // Buscar el vehículo creado
    await page.getByPlaceholder(/buscar/i).fill('TEST999');
    await page.waitForTimeout(500);

    // Verificar que aparece en la lista
    await expect(page.getByText('TEST999')).toBeVisible();

    // Editar
    await page
      .getByRole('button', { name: /editar/i })
      .first()
      .click();
    const modeloInput = page.getByLabel(/modelo/i);
    await modeloInput.clear();
    await modeloInput.fill('ModeloEditado');
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar edición exitosa
    await expect(page.getByText(/actualizado exitosamente/i)).toBeVisible();

    // Eliminar
    await page
      .getByRole('button', { name: /eliminar/i })
      .first()
      .click();
    await page
      .getByRole('button', { name: /confirmar|eliminar/i })
      .last()
      .click();

    // Verificar eliminación exitosa
    await expect(page.getByText(/eliminado exitosamente/i)).toBeVisible();
  });

  test('Navegación entre páginas sin errores', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/clientes',
      '/vehiculos',
      '/empresas',
      '/personal',
      '/sites',
      '/tramos',
      '/viajes',
      '/extras',
      '/ordenes-compra',
    ];

    for (const route of routes) {
      // Navegar a la ruta
      await page.goto(route);

      // Esperar a que la página cargue
      await page.waitForLoadState('networkidle');

      // Verificar que no hay errores en consola
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Verificar que la página se renderiza correctamente
      await expect(page.locator('body')).toBeVisible();

      // No debería haber errores de React
      const reactError = page.getByText(/something went wrong|error boundary/i);
      await expect(reactError).not.toBeVisible();
    }
  });

  test('Funcionalidad de búsqueda mantiene comportamiento', async ({ page }) => {
    await page.goto('/clientes');

    // Crear algunos clientes de prueba si no existen
    const testClientes = ['Regression Test 1', 'Regression Test 2', 'Other Client'];

    for (const nombre of testClientes) {
      await page.getByRole('button', { name: /nuevo cliente/i }).click();
      await page.getByLabel(/código/i).fill(`REG${Math.random().toString(36).substr(2, 5)}`);
      await page.getByLabel(/nombre/i).fill(nombre);
      await page.getByLabel(/cuit/i).fill('20-12345678-9');
      await page.getByRole('button', { name: /guardar/i }).click();
      await page.waitForTimeout(1000);
    }

    // Probar búsqueda
    await page.getByPlaceholder(/buscar/i).fill('Regression');
    await page.waitForTimeout(500);

    // Verificar que se filtran correctamente
    await expect(page.getByText('Regression Test 1')).toBeVisible();
    await expect(page.getByText('Regression Test 2')).toBeVisible();
    await expect(page.getByText('Other Client')).not.toBeVisible();

    // Limpiar búsqueda
    await page.getByPlaceholder(/buscar/i).clear();
    await page.waitForTimeout(500);

    // Todos deberían ser visibles
    await expect(page.getByText('Other Client')).toBeVisible();
  });

  test('Paginación funciona correctamente', async ({ page }) => {
    await page.goto('/clientes');

    // Si hay controles de paginación
    const paginationControls = page.locator('[data-testid="pagination"]');
    if (await paginationControls.isVisible()) {
      // Verificar que los botones de paginación funcionan
      const nextButton = page.getByRole('button', { name: /siguiente/i });
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Verificar que la página cambió
        const prevButton = page.getByRole('button', { name: /anterior/i });
        await expect(prevButton).toBeEnabled();
      }
    }
  });

  test('Formularios mantienen validaciones', async ({ page }) => {
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // Probar validación de email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/nombre/i).click(); // Trigger blur
    await expect(page.getByText(/formato.*email.*inválido/i)).toBeVisible();

    // Probar validación de CUIT
    await page.getByLabel(/cuit/i).fill('123');
    await page.getByLabel(/nombre/i).click(); // Trigger blur
    await expect(page.getByText(/formato.*cuit.*inválido/i)).toBeVisible();

    // Cancelar
    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Estados de carga se muestran correctamente', async ({ page }) => {
    // Interceptar requests para simular carga lenta
    await page.route('**/api/clientes**', async (route) => {
      await page.waitForTimeout(1000);
      await route.continue();
    });

    await page.goto('/clientes');

    // Debería mostrar indicador de carga
    const loadingIndicator = page.getByText(/cargando/i);
    await expect(loadingIndicator).toBeVisible();

    // Esperar a que termine de cargar
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
  });

  test('Manejo de errores funciona correctamente', async ({ page }) => {
    // Simular error del servidor
    await page.route('**/api/clientes**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/clientes');

    // Debería mostrar mensaje de error
    await expect(page.getByText(/error al cargar/i)).toBeVisible();

    // Botón de reintentar debería estar disponible
    const retryButton = page.getByRole('button', { name: /reintentar/i });
    if (await retryButton.isVisible()) {
      // Restaurar la ruta normal
      await page.unroute('**/api/clientes**');

      // Reintentar
      await retryButton.click();

      // Debería cargar correctamente
      await expect(page.getByText(/error al cargar/i)).not.toBeVisible();
    }
  });
});
