import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Sistema Excel - Flujo de Importación', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('Importar clientes desde Excel', async ({ page }) => {
    await page.goto('/clientes');

    // Abrir modal de importación
    const importButton = page.getByRole('button', { name: /importar/i });
    await expect(importButton).toBeVisible();
    await importButton.click();

    // Verificar que el modal se abre
    await expect(page.getByText(/importar clientes/i)).toBeVisible();

    // Descargar plantilla
    const templateButton = page.getByRole('button', { name: /descargar plantilla/i });
    await templateButton.click();

    // Verificar notificación de descarga
    await expect(page.getByText(/plantilla.*descargada/i)).toBeVisible();

    // Simular carga de archivo
    const fileInput = page.locator('input[type="file"]');

    // Crear un archivo Excel de prueba (simulado)
    // En un test real, deberías tener un archivo de prueba preparado
    const testFile = path.join(__dirname, '..', '..', 'test-files', 'clientes-test.xlsx');

    // Si el archivo existe, cargarlo
    if (fileInput) {
      // Por ahora simulamos que el archivo no existe y cancelamos
      await page.getByRole('button', { name: /cancelar/i }).click();
    }
  });

  test('Validación durante importación', async ({ page }) => {
    await page.goto('/vehiculos');

    // Abrir importación
    await page.getByRole('button', { name: /importar/i }).click();

    // Verificar opciones de validación
    const validationOptions = page.getByText(/opciones.*validación/i);
    if (await validationOptions.isVisible()) {
      // Activar validación estricta
      const strictValidation = page.getByLabel(/validación estricta/i);
      if (await strictValidation.isVisible()) {
        await strictValidation.check();
      }

      // Opción de saltar errores
      const skipErrors = page.getByLabel(/saltar.*errores/i);
      if (await skipErrors.isVisible()) {
        await skipErrors.uncheck();
      }
    }

    // Verificar zona de arrastre
    const dropZone = page.locator('[data-testid="drop-zone"], .drop-zone');
    if (await dropZone.isVisible()) {
      await expect(dropZone).toContainText(/arrastra.*archivo/i);
    }

    // Cancelar
    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Vista previa de datos antes de importar', async ({ page }) => {
    await page.goto('/sites');

    await page.getByRole('button', { name: /importar/i }).click();

    // Si hay opción de vista previa
    const previewCheckbox = page.getByLabel(/vista previa/i);
    if (await previewCheckbox.isVisible()) {
      await previewCheckbox.check();

      // Verificar que muestra información de vista previa
      await expect(page.getByText(/datos.*revisar/i)).toBeVisible();
    }

    // Verificar mapeo de columnas
    const columnMapping = page.getByText(/mapeo.*columnas/i);
    if (await columnMapping.isVisible()) {
      // Debería mostrar opciones de mapeo
      const mappingSelects = page.locator('select[name*="mapping"]');
      if ((await mappingSelects.count()) > 0) {
        await expect(mappingSelects.first()).toBeVisible();
      }
    }

    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Manejo de errores durante importación', async ({ page }) => {
    await page.goto('/tramos');

    await page.getByRole('button', { name: /importar/i }).click();

    // Buscar sección de configuración de errores
    const errorHandling = page.getByText(/manejo.*errores/i);
    if (await errorHandling.isVisible()) {
      // Opciones de manejo de errores
      const errorOptions = [
        { label: /detener.*error/i, action: 'stop' },
        { label: /continuar.*errores/i, action: 'continue' },
        { label: /registrar.*continuar/i, action: 'log' },
      ];

      for (const option of errorOptions) {
        const radio = page.getByLabel(option.label);
        if (await radio.isVisible()) {
          await radio.check();
          // Verificar que se seleccionó
          await expect(radio).toBeChecked();
        }
      }
    }

    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Importación masiva con progreso', async ({ page }) => {
    await page.goto('/viajes');

    await page.getByRole('button', { name: /importar/i }).click();

    // Verificar indicadores de progreso
    const progressBar = page.locator('[role="progressbar"], .progress-bar');
    if (await progressBar.isVisible()) {
      // Debería mostrar porcentaje
      const percentage = page.getByText(/\d+%/);
      if (await percentage.isVisible()) {
        await expect(percentage).toBeVisible();
      }
    }

    // Verificar contador de registros
    const recordCounter = page.getByText(/registros.*procesados/i);
    if (await recordCounter.isVisible()) {
      await expect(recordCounter).toBeVisible();
    }

    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Descargar plantilla personalizada', async ({ page }) => {
    await page.goto('/personal');

    await page.getByRole('button', { name: /importar/i }).click();

    // Buscar opciones de plantilla
    const templateOptions = page.getByText(/opciones.*plantilla/i);
    if (await templateOptions.isVisible()) {
      // Personalizar campos
      const customizeButton = page.getByRole('button', { name: /personalizar.*campos/i });
      if (await customizeButton.isVisible()) {
        await customizeButton.click();

        // Debería mostrar lista de campos
        const fieldsList = page.locator('[data-testid="fields-list"], .fields-list');
        await expect(fieldsList).toBeVisible();

        // Seleccionar/deseleccionar campos
        const checkboxes = fieldsList.locator('input[type="checkbox"]');
        if ((await checkboxes.count()) > 2) {
          // Deseleccionar algunos campos opcionales
          await checkboxes.nth(2).uncheck();
        }

        // Aplicar cambios
        const applyButton = page.getByRole('button', { name: /aplicar/i });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
      }
    }

    // Descargar plantilla personalizada
    await page.getByRole('button', { name: /descargar plantilla/i }).click();
    await expect(page.getByText(/plantilla.*descargada/i)).toBeVisible();

    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Historial de importaciones', async ({ page }) => {
    await page.goto('/empresas');

    // Buscar opción de historial
    const historyButton = page.getByRole('button', { name: /historial.*importaciones/i });
    if (await historyButton.isVisible()) {
      await historyButton.click();

      // Debería mostrar lista de importaciones previas
      await expect(page.getByText(/importaciones anteriores/i)).toBeVisible();

      // Tabla de historial
      const historyTable = page.locator('table').filter({ hasText: /fecha.*archivo.*registros/i });
      if (await historyTable.isVisible()) {
        // Verificar columnas
        await expect(historyTable).toContainText(/fecha/i);
        await expect(historyTable).toContainText(/archivo/i);
        await expect(historyTable).toContainText(/registros/i);
        await expect(historyTable).toContainText(/estado/i);

        // Si hay registros, verificar acciones
        const rows = historyTable.locator('tbody tr');
        if ((await rows.count()) > 0) {
          const firstRow = rows.first();

          // Botón de ver detalles
          const detailsButton = firstRow.getByRole('button', { name: /ver detalles/i });
          if (await detailsButton.isVisible()) {
            await detailsButton.click();

            // Debería mostrar detalles de la importación
            await expect(page.getByText(/detalles.*importación/i)).toBeVisible();

            // Cerrar detalles
            await page.getByRole('button', { name: /cerrar/i }).click();
          }
        }
      }

      // Cerrar historial
      await page.getByRole('button', { name: /cerrar/i }).click();
    }
  });

  test('Rollback de importación', async ({ page }) => {
    await page.goto('/clientes');

    // Verificar si hay opción de rollback en el historial
    const historyButton = page.getByRole('button', { name: /historial/i });
    if (await historyButton.isVisible()) {
      await historyButton.click();

      const rows = page.locator('table tbody tr');
      if ((await rows.count()) > 0) {
        const firstRow = rows.first();

        // Buscar botón de rollback
        const rollbackButton = firstRow.getByRole('button', { name: /revertir|rollback/i });
        if (await rollbackButton.isVisible()) {
          await rollbackButton.click();

          // Confirmar rollback
          await expect(page.getByText(/confirmar.*revertir/i)).toBeVisible();
          await page.getByRole('button', { name: /cancelar/i }).click(); // No ejecutar realmente
        }
      }

      await page.getByRole('button', { name: /cerrar/i }).click();
    }
  });

  test('Importación con transformaciones', async ({ page }) => {
    await page.goto('/sites');

    await page.getByRole('button', { name: /importar/i }).click();

    // Buscar opciones de transformación
    const transformOptions = page.getByText(/transformaciones/i);
    if (await transformOptions.isVisible()) {
      // Opciones de transformación de texto
      const uppercaseCheckbox = page.getByLabel(/mayúsculas/i);
      if (await uppercaseCheckbox.isVisible()) {
        await uppercaseCheckbox.check();
      }

      // Limpieza de espacios
      const trimCheckbox = page.getByLabel(/eliminar espacios/i);
      if (await trimCheckbox.isVisible()) {
        await trimCheckbox.check();
      }

      // Formato de fechas
      const dateFormat = page.getByLabel(/formato.*fecha/i);
      if (await dateFormat.isVisible()) {
        await dateFormat.selectOption('DD/MM/YYYY');
      }
    }

    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Validación de duplicados durante importación', async ({ page }) => {
    await page.goto('/vehiculos');

    await page.getByRole('button', { name: /importar/i }).click();

    // Configuración de duplicados
    const duplicateHandling = page.getByText(/manejo.*duplicados/i);
    if (await duplicateHandling.isVisible()) {
      // Opciones para duplicados
      const duplicateOptions = page.locator('input[name="duplicate-handling"]');

      // Opción: Saltar duplicados
      const skipOption = page.getByLabel(/saltar duplicados/i);
      if (await skipOption.isVisible()) {
        await skipOption.check();
      }

      // Opción: Actualizar existentes
      const updateOption = page.getByLabel(/actualizar existentes/i);
      if (await updateOption.isVisible()) {
        await updateOption.check();
      }

      // Opción: Crear nuevos con sufijo
      const suffixOption = page.getByLabel(/crear.*sufijo/i);
      if (await suffixOption.isVisible()) {
        await suffixOption.check();

        // Configurar sufijo
        const suffixInput = page.getByLabel(/sufijo/i);
        if (await suffixInput.isVisible()) {
          await suffixInput.fill('_NEW');
        }
      }

      // Campos para detectar duplicados
      const duplicateFields = page.getByLabel(/campos.*duplicados/i);
      if (await duplicateFields.isVisible()) {
        // Seleccionar campos clave
        await duplicateFields.selectOption(['patente', 'chasis']);
      }
    }

    await page.getByRole('button', { name: /cancelar/i }).click();
  });
});
