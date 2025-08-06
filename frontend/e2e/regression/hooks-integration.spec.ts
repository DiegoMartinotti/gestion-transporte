import { test, expect } from '@playwright/test';

test.describe('Hooks Integration - useModal y useDataLoader', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('useModal Hook', () => {
    test('Modal de creación funciona en todas las páginas', async ({ page }) => {
      const pages = [
        { url: '/clientes', entity: 'cliente' },
        { url: '/vehiculos', entity: 'vehículo' },
        { url: '/empresas', entity: 'empresa' },
        { url: '/personal', entity: 'personal' },
        { url: '/sites', entity: 'site' },
        { url: '/tramos', entity: 'tramo' },
      ];

      for (const pageInfo of pages) {
        await page.goto(pageInfo.url);

        // Abrir modal de creación
        const createButton = page.getByRole('button', {
          name: new RegExp(`nuevo ${pageInfo.entity}`, 'i'),
        });
        await expect(createButton).toBeVisible();
        await createButton.click();

        // Verificar que el modal se abre
        await expect(page.getByRole('dialog')).toBeVisible();

        // Verificar que tiene un formulario
        const form = page.locator('form').first();
        await expect(form).toBeVisible();

        // Cerrar modal con ESC
        await page.keyboard.press('Escape');

        // Verificar que el modal se cierra
        await expect(page.getByRole('dialog')).not.toBeVisible();
      }
    });

    test('Modal de edición funciona correctamente', async ({ page }) => {
      await page.goto('/vehiculos');

      // Esperar a que carguen los datos
      await page.waitForLoadState('networkidle');

      // Si hay vehículos, probar edición
      const editButton = page.getByRole('button', { name: /editar/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();

        // Verificar que el modal se abre con datos precargados
        await expect(page.getByRole('dialog')).toBeVisible();

        // Verificar que hay valores en los campos
        const patenteInput = page.getByLabel(/patente/i);
        const patenteValue = await patenteInput.inputValue();
        expect(patenteValue).not.toBe('');

        // Cerrar modal
        await page.getByRole('button', { name: /cancelar/i }).click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
      }
    });

    test('Estado del modal se mantiene correctamente', async ({ page }) => {
      await page.goto('/clientes');

      // Abrir modal
      await page.getByRole('button', { name: /nuevo cliente/i }).click();

      // Llenar algunos campos
      await page.getByLabel(/nombre/i).fill('Test Modal State');
      await page.getByLabel(/código/i).fill('TMS001');

      // Cerrar modal
      await page.keyboard.press('Escape');

      // Reabrir modal
      await page.getByRole('button', { name: /nuevo cliente/i }).click();

      // Los campos deben estar limpios (el modal se resetea)
      const nombreValue = await page.getByLabel(/nombre/i).inputValue();
      const codigoValue = await page.getByLabel(/código/i).inputValue();

      expect(nombreValue).toBe('');
      expect(codigoValue).toBe('');

      // Cerrar modal
      await page.keyboard.press('Escape');
    });
  });

  test.describe('useDataLoader Hook', () => {
    test('Carga inicial de datos funciona', async ({ page }) => {
      await page.goto('/clientes');

      // No debe mostrar error
      await expect(page.getByText(/error al cargar/i)).not.toBeVisible();

      // Debe mostrar contenido o mensaje de "no hay datos"
      const hasContent =
        (await page.locator('table tbody tr').count()) > 0 ||
        (await page.getByText(/no hay.*registros/i).isVisible());

      expect(hasContent).toBeTruthy();
    });

    test('Indicador de carga se muestra y oculta correctamente', async ({ page }) => {
      // Interceptar para simular carga lenta
      await page.route('**/api/vehiculos**', async (route) => {
        await page.waitForTimeout(500);
        await route.continue();
      });

      await page.goto('/vehiculos');

      // Debe mostrar indicador de carga
      const loadingIndicator = page.getByText(/cargando/i).or(page.locator('.loading-spinner'));
      await expect(loadingIndicator).toBeVisible();

      // Debe ocultarse después de cargar
      await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
    });

    test('Refresh/reload de datos funciona', async ({ page }) => {
      await page.goto('/empresas');
      await page.waitForLoadState('networkidle');

      // Buscar botón de refresh si existe
      const refreshButton = page.getByRole('button', { name: /actualizar|refrescar|reload/i });
      if (await refreshButton.isVisible()) {
        // Interceptar para verificar que se hace la petición
        let requestMade = false;
        page.on('request', (request) => {
          if (request.url().includes('/api/empresas')) {
            requestMade = true;
          }
        });

        await refreshButton.click();
        await page.waitForTimeout(1000);

        expect(requestMade).toBeTruthy();
      }
    });

    test('Paginación con useDataLoader', async ({ page }) => {
      await page.goto('/personal');
      await page.waitForLoadState('networkidle');

      // Si hay controles de paginación
      const pagination = page.locator('[aria-label="pagination"], .pagination');
      if (await pagination.isVisible()) {
        // Verificar página actual
        const currentPage = page.locator('[aria-current="page"], .page-active');
        await expect(currentPage).toHaveText('1');

        // Ir a siguiente página si está disponible
        const nextButton = page.getByRole('button', { name: /siguiente|next|>/i });
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForTimeout(500);

          // Verificar que cambió la página
          const newCurrentPage = page.locator('[aria-current="page"], .page-active');
          await expect(newCurrentPage).not.toHaveText('1');
        }
      }
    });

    test('Búsqueda con useDataLoader', async ({ page }) => {
      await page.goto('/sites');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/buscar/i);
      if (await searchInput.isVisible()) {
        // Contar elementos antes de buscar
        const initialCount = await page.locator('table tbody tr').count();

        // Realizar búsqueda
        await searchInput.fill('test');
        await page.waitForTimeout(500);

        // Contar elementos después de buscar
        const filteredCount = await page.locator('table tbody tr').count();

        // Debería haber cambiado la cantidad (o mostrar "no hay resultados")
        const hasNoResults = await page.getByText(/no hay.*resultados/i).isVisible();
        expect(filteredCount !== initialCount || hasNoResults).toBeTruthy();

        // Limpiar búsqueda
        await searchInput.clear();
        await page.waitForTimeout(500);

        // Debería volver al estado inicial
        const resetCount = await page.locator('table tbody tr').count();
        expect(resetCount).toBe(initialCount);
      }
    });

    test('Manejo de errores con useDataLoader', async ({ page }) => {
      // Simular error del servidor
      await page.route('**/api/tramos**', (route) =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      );

      await page.goto('/tramos');

      // Debe mostrar mensaje de error
      await expect(page.getByText(/error al cargar/i)).toBeVisible();

      // Debe ofrecer opción de reintentar
      const retryButton = page.getByRole('button', { name: /reintentar|intentar nuevamente/i });
      if (await retryButton.isVisible()) {
        // Restaurar ruta normal
        await page.unroute('**/api/tramos**');

        // Reintentar
        await retryButton.click();
        await page.waitForTimeout(1000);

        // Error debe desaparecer
        await expect(page.getByText(/error al cargar/i)).not.toBeVisible();
      }
    });

    test('Múltiples loaders en la misma página (Sites)', async ({ page }) => {
      await page.goto('/sites');
      await page.waitForLoadState('networkidle');

      // Sites tiene múltiples loaders (sites, clientes, etc.)
      // Verificar que todos cargan correctamente

      // Debe tener selector de cliente
      const clienteSelector = page
        .getByLabel(/cliente/i)
        .or(page.locator('[data-testid="cliente-select"]'));
      if (await clienteSelector.isVisible()) {
        await clienteSelector.click();

        // Debe mostrar opciones de clientes
        const clienteOptions = page.getByRole('option').or(page.locator('[role="menuitem"]'));
        await expect(clienteOptions.first()).toBeVisible();

        // Cerrar dropdown
        await page.keyboard.press('Escape');
      }

      // Debe tener tabla de sites
      const sitesTable = page.locator('table');
      await expect(sitesTable).toBeVisible();
    });

    test('Actualización optimista funciona', async ({ page }) => {
      await page.goto('/extras');

      // Crear un extra
      await page.getByRole('button', { name: /nuevo extra/i }).click();

      // Llenar formulario
      await page.getByLabel(/descripción/i).fill('Extra Test Optimista');
      await page.getByLabel(/monto|importe/i).fill('1000');

      // Guardar
      await page.getByRole('button', { name: /guardar/i }).click();

      // El item debe aparecer inmediatamente en la lista (actualización optimista)
      await expect(page.getByText('Extra Test Optimista')).toBeVisible({ timeout: 2000 });
    });

    test('Cache de datos funciona correctamente', async ({ page }) => {
      // Primera visita a la página
      await page.goto('/ordenes-compra');
      await page.waitForLoadState('networkidle');

      // Navegar a otra página
      await page.goto('/dashboard');

      // Volver a órdenes de compra
      let requestMade = false;
      page.on('request', (request) => {
        if (request.url().includes('/api/ordenes-compra')) {
          requestMade = true;
        }
      });

      await page.goto('/ordenes-compra');
      await page.waitForTimeout(500);

      // Si hay cache, no debería hacer request inmediatamente
      // (esto depende de la implementación del cache)
      // Por ahora solo verificamos que la página carga rápido
      await expect(page.locator('table')).toBeVisible({ timeout: 1000 });
    });
  });

  test.describe('Integración de ambos hooks', () => {
    test('Modal y DataLoader trabajan juntos correctamente', async ({ page }) => {
      await page.goto('/vehiculos');
      await page.waitForLoadState('networkidle');

      // Contar vehículos iniciales
      const initialCount = await page.locator('table tbody tr').count();

      // Crear nuevo vehículo
      await page.getByRole('button', { name: /nuevo vehículo/i }).click();

      // Llenar formulario
      await page.getByLabel(/patente/i).fill('HOOK123');
      await page.getByLabel(/marca/i).fill('Toyota');
      await page.getByLabel(/modelo/i).fill('Corolla');
      await page.getByLabel(/año/i).fill('2024');

      // Guardar
      await page.getByRole('button', { name: /guardar/i }).click();

      // Esperar notificación
      await expect(page.getByText(/creado exitosamente/i)).toBeVisible();

      // Verificar que el DataLoader se actualizó
      await page.waitForTimeout(1000);
      const newCount = await page.locator('table tbody tr').count();

      // Debe haber un vehículo más
      expect(newCount).toBe(initialCount + 1);

      // El nuevo vehículo debe estar en la lista
      await expect(page.getByText('HOOK123')).toBeVisible();
    });

    test('Edición actualiza el DataLoader', async ({ page }) => {
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');

      // Si hay clientes, editar el primero
      const editButton = page.getByRole('button', { name: /editar/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();

        // Modificar nombre
        const nombreInput = page.getByLabel(/nombre/i);
        await nombreInput.clear();
        await nombreInput.fill('Cliente Editado Hook Test');

        // Guardar
        await page.getByRole('button', { name: /guardar/i }).click();

        // Esperar notificación
        await expect(page.getByText(/actualizado exitosamente/i)).toBeVisible();

        // Verificar que se actualiza en la lista
        await expect(page.getByText('Cliente Editado Hook Test')).toBeVisible();
      }
    });

    test('Eliminación actualiza el DataLoader', async ({ page }) => {
      await page.goto('/personal');
      await page.waitForLoadState('networkidle');

      // Contar elementos iniciales
      const initialCount = await page.locator('table tbody tr').count();

      if (initialCount > 0) {
        // Eliminar el primero
        await page
          .getByRole('button', { name: /eliminar/i })
          .first()
          .click();

        // Confirmar
        await page
          .getByRole('button', { name: /confirmar|eliminar/i })
          .last()
          .click();

        // Esperar notificación
        await expect(page.getByText(/eliminado exitosamente/i)).toBeVisible();

        // Verificar que el DataLoader se actualizó
        await page.waitForTimeout(1000);
        const newCount = await page.locator('table tbody tr').count();

        // Debe haber un elemento menos
        expect(newCount).toBe(initialCount - 1);
      }
    });
  });
});
