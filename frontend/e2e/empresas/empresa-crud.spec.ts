import { test, expect } from '@playwright/test';

test.describe('Empresas - Operaciones CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Navegar a empresas
    await page.goto('/empresas');
    await expect(page).toHaveURL('/empresas');
  });

  test('Crear nueva empresa completa', async ({ page }) => {
    // Click en nueva empresa
    await page.getByRole('button', { name: /nueva empresa/i }).click();

    // Información básica
    await page.getByLabel(/razón social/i).fill('Transportes del Sur SA');
    await page.getByLabel(/nombre.*fantasía/i).fill('TransSur');
    await page.getByLabel(/cuit/i).fill('30-71234567-8');

    // Información de contacto
    await page.getByLabel(/email/i).fill('info@transsur.com');
    await page.getByLabel(/teléfono/i).fill('011-4555-6789');
    await page.getByLabel(/sitio web/i).fill('www.transsur.com');

    // Dirección
    await page.getByLabel(/calle/i).fill('Av. Libertador');
    await page.getByLabel(/número/i).fill('1234');
    await page.getByLabel(/piso/i).fill('5');
    await page.getByLabel(/departamento/i).fill('A');
    await page.getByLabel(/ciudad/i).fill('Buenos Aires');
    await page.getByLabel(/provincia/i).selectOption('Buenos Aires');
    await page.getByLabel(/código postal/i).fill('1425');

    // Información fiscal
    await page.getByLabel(/condición.*iva/i).selectOption('Responsable Inscripto');
    await page.getByLabel(/ingresos brutos/i).fill('901-123456-7');

    // Datos bancarios
    await page.getByLabel(/banco/i).fill('Banco Nación');
    await page.getByLabel(/tipo.*cuenta/i).selectOption('Cuenta Corriente');
    await page.getByLabel(/número.*cuenta/i).fill('1234567890');
    await page.getByLabel(/cbu/i).fill('0110123456789012345678');

    // Guardar
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar creación exitosa
    await expect(page.getByText(/empresa creada exitosamente/i)).toBeVisible();
    await expect(page.getByText('Transportes del Sur SA')).toBeVisible();
    await expect(page.getByText('30-71234567-8')).toBeVisible();
  });

  test('Editar información de empresa', async ({ page }) => {
    // Buscar empresa
    await page.getByPlaceholder(/buscar/i).fill('TransSur');
    await page.waitForTimeout(500);

    // Editar
    await page
      .getByRole('button', { name: /editar/i })
      .first()
      .click();

    // Modificar datos
    const telefonoInput = page.getByLabel(/teléfono/i);
    await telefonoInput.clear();
    await telefonoInput.fill('011-4555-9999');

    // Agregar sucursal
    const sucursalTab = page.getByRole('tab', { name: /sucursales/i });
    if (await sucursalTab.isVisible()) {
      await sucursalTab.click();

      await page.getByRole('button', { name: /agregar sucursal/i }).click();
      await page.getByLabel(/nombre.*sucursal/i).fill('Sucursal Zona Norte');
      await page.getByLabel(/dirección.*sucursal/i).fill('Av. Maipú 2000');
      await page.getByLabel(/teléfono.*sucursal/i).fill('011-4777-8888');
    }

    // Guardar cambios
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar actualización
    await expect(page.getByText(/empresa actualizada exitosamente/i)).toBeVisible();
  });

  test('Gestionar flota de vehículos de la empresa', async ({ page }) => {
    // Ver detalles de empresa
    await page
      .getByRole('button', { name: /ver detalles/i })
      .first()
      .click();

    // Ir a sección de flota
    const flotaSection = page.getByText(/flota.*vehículos/i);
    if (await flotaSection.isVisible()) {
      // Ver vehículos asignados
      const vehiculosTable = page.locator('table').filter({ hasText: /patente.*marca/i });
      if (await vehiculosTable.isVisible()) {
        const vehicleCount = await vehiculosTable.locator('tbody tr').count();

        // Agregar vehículo a la flota
        const addVehicleButton = page.getByRole('button', { name: /agregar.*flota/i });
        if (await addVehicleButton.isVisible()) {
          await addVehicleButton.click();

          // Seleccionar vehículo disponible
          await page.getByLabel(/vehículo/i).click();
          await page.getByRole('option').first().click();

          // Fecha de asignación
          await page.getByLabel(/fecha.*asignación/i).fill('2025-01-01');

          // Guardar
          await page.getByRole('button', { name: /agregar/i }).click();

          // Verificar que se agregó
          const newVehicleCount = await vehiculosTable.locator('tbody tr').count();
          expect(newVehicleCount).toBe(vehicleCount + 1);
        }
      }
    }

    // Cerrar detalles
    await page.getByRole('button', { name: /cerrar/i }).click();
  });

  test('Gestionar empleados de la empresa', async ({ page }) => {
    // Editar empresa
    await page
      .getByRole('button', { name: /editar/i })
      .first()
      .click();

    // Ir a pestaña de empleados
    const empleadosTab = page.getByRole('tab', { name: /empleados/i });
    if (await empleadosTab.isVisible()) {
      await empleadosTab.click();

      // Ver lista de empleados
      const empleadosTable = page.locator('table').filter({ hasText: /nombre.*cargo/i });
      if (await empleadosTable.isVisible()) {
        const employeeCount = await empleadosTable.locator('tbody tr').count();

        // Estadísticas
        await expect(page.getByText(/total.*empleados/i)).toBeVisible();
        await expect(page.getByText(/activos/i)).toBeVisible();

        // Filtrar por cargo
        const cargoFilter = page.getByLabel(/filtrar.*cargo/i);
        if (await cargoFilter.isVisible()) {
          await cargoFilter.selectOption('Conductor');
          await page.waitForTimeout(500);
        }
      }
    }

    // Cerrar
    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Configurar datos fiscales y bancarios', async ({ page }) => {
    // Editar empresa
    await page
      .getByRole('button', { name: /editar/i })
      .first()
      .click();

    // Ir a configuración fiscal
    const fiscalTab = page.getByRole('tab', { name: /fiscal|impuestos/i });
    if (await fiscalTab.isVisible()) {
      await fiscalTab.click();

      // Agregar certificados
      await page.getByRole('button', { name: /agregar certificado/i }).click();
      await page.getByLabel(/tipo.*certificado/i).selectOption('Exclusión IIBB');
      await page.getByLabel(/número.*certificado/i).fill('CERT-2025-001');
      await page.getByLabel(/vigencia desde/i).fill('2025-01-01');
      await page.getByLabel(/vigencia hasta/i).fill('2025-12-31');

      // Guardar certificado
      await page.getByRole('button', { name: /agregar/i }).click();
    }

    // Ir a datos bancarios
    const bancariosTab = page.getByRole('tab', { name: /bancarios|banco/i });
    if (await bancariosTab.isVisible()) {
      await bancariosTab.click();

      // Agregar cuenta secundaria
      await page.getByRole('button', { name: /agregar cuenta/i }).click();
      await page.getByLabel(/banco/i).last().fill('Banco Santander');
      await page
        .getByLabel(/tipo.*cuenta/i)
        .last()
        .selectOption('Caja de Ahorro');
      await page
        .getByLabel(/número.*cuenta/i)
        .last()
        .fill('9876543210');
      await page.getByLabel(/cbu/i).last().fill('0720987654321098765432');

      // Marcar como cuenta principal
      const principalCheckbox = page.getByLabel(/cuenta principal/i);
      if (await principalCheckbox.isVisible()) {
        await principalCheckbox.check();
      }
    }

    // Guardar todos los cambios
    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/empresa actualizada/i)).toBeVisible();
  });

  test('Ver estadísticas y reportes de empresa', async ({ page }) => {
    // Ver detalles
    await page
      .getByRole('button', { name: /ver detalles/i })
      .first()
      .click();

    // Buscar sección de estadísticas
    const statsSection = page.getByText(/estadísticas|resumen/i);
    if (await statsSection.isVisible()) {
      // Verificar métricas
      await expect(page.getByText(/vehículos.*activos/i)).toBeVisible();
      await expect(page.getByText(/empleados.*total/i)).toBeVisible();
      await expect(page.getByText(/viajes.*mes/i)).toBeVisible();

      // Gráficos
      const charts = page.locator('canvas, svg.chart');
      if ((await charts.count()) > 0) {
        await expect(charts.first()).toBeVisible();
      }

      // Generar reporte
      const reportButton = page.getByRole('button', { name: /generar reporte/i });
      if (await reportButton.isVisible()) {
        await reportButton.click();

        // Configurar reporte
        await page.getByLabel(/período/i).selectOption('Último mes');
        await page.getByLabel(/tipo.*reporte/i).selectOption('Completo');

        // Generar
        await page.getByRole('button', { name: /generar/i }).click();
        await expect(page.getByText(/reporte generado/i)).toBeVisible();
      }
    }

    // Cerrar
    await page.getByRole('button', { name: /cerrar/i }).click();
  });

  test('Fusionar empresas duplicadas', async ({ page }) => {
    // Buscar herramienta de fusión
    const mergeButton = page.getByRole('button', { name: /fusionar.*duplicadas/i });
    if (await mergeButton.isVisible()) {
      await mergeButton.click();

      // Seleccionar empresas a fusionar
      await page.getByLabel(/empresa principal/i).click();
      await page.getByRole('option').first().click();

      await page.getByLabel(/empresa.*fusionar/i).click();
      await page.getByRole('option').nth(1).click();

      // Ver preview de fusión
      await page.getByRole('button', { name: /preview|vista previa/i }).click();

      // Verificar que muestra los datos que se conservarán
      await expect(page.getByText(/datos.*conservar/i)).toBeVisible();
      await expect(page.getByText(/datos.*eliminar/i)).toBeVisible();

      // Cancelar (no ejecutar fusión real)
      await page.getByRole('button', { name: /cancelar/i }).click();
    }
  });

  test('Desactivar y reactivar empresa', async ({ page }) => {
    // Buscar empresa para desactivar
    await page.getByPlaceholder(/buscar/i).fill('Test Desactivar');
    await page.waitForTimeout(500);

    // Si no existe, crear una
    if (await page.getByText('No se encontraron resultados').isVisible()) {
      await page.getByRole('button', { name: /nueva empresa/i }).click();
      await page.getByLabel(/razón social/i).fill('Test Desactivar SA');
      await page.getByLabel(/cuit/i).fill('30-99999999-9');
      await page.getByRole('button', { name: /guardar/i }).click();
      await page.waitForTimeout(1000);
    }

    // Desactivar
    const deactivateButton = page.getByRole('button', { name: /desactivar/i }).first();
    if (await deactivateButton.isVisible()) {
      await deactivateButton.click();

      // Confirmar
      await expect(page.getByText(/confirmar.*desactivación/i)).toBeVisible();
      await page.getByLabel(/motivo/i).fill('Empresa sin operaciones');
      await page.getByRole('button', { name: /confirmar/i }).click();

      // Verificar desactivación
      await expect(page.getByText(/empresa desactivada/i)).toBeVisible();
      await expect(page.getByText(/inactiva/i)).toBeVisible();

      // Reactivar
      const reactivateButton = page.getByRole('button', { name: /reactivar/i }).first();
      await reactivateButton.click();

      await expect(page.getByText(/empresa reactivada/i)).toBeVisible();
    }
  });

  test('Historial de cambios de empresa', async ({ page }) => {
    // Ver detalles
    await page
      .getByRole('button', { name: /ver detalles/i })
      .first()
      .click();

    // Buscar historial
    const historyTab = page.getByRole('tab', { name: /historial|auditoría/i });
    if (await historyTab.isVisible()) {
      await historyTab.click();

      // Ver lista de cambios
      await expect(page.getByText(/historial.*cambios/i)).toBeVisible();

      const historyTable = page.locator('table').filter({ hasText: /fecha.*usuario.*acción/i });
      if (await historyTable.isVisible()) {
        // Verificar que hay registros
        const rows = historyTable.locator('tbody tr');
        expect(await rows.count()).toBeGreaterThan(0);

        // Ver detalle de un cambio
        const detailButton = rows.first().getByRole('button', { name: /ver detalle/i });
        if (await detailButton.isVisible()) {
          await detailButton.click();

          // Verificar que muestra los cambios
          await expect(page.getByText(/campos modificados/i)).toBeVisible();
          await expect(page.getByText(/valor anterior/i)).toBeVisible();
          await expect(page.getByText(/valor nuevo/i)).toBeVisible();

          // Cerrar detalle
          await page.keyboard.press('Escape');
        }
      }
    }

    // Cerrar
    await page.getByRole('button', { name: /cerrar/i }).click();
  });

  test('Exportar datos de empresas', async ({ page }) => {
    // Seleccionar empresas para exportar
    const checkboxes = page.locator('input[type="checkbox"]');
    if ((await checkboxes.count()) > 1) {
      // Seleccionar las primeras 3
      for (let i = 1; i <= Math.min(3, (await checkboxes.count()) - 1); i++) {
        await checkboxes.nth(i).check();
      }
    }

    // Exportar seleccionadas
    const exportButton = page.getByRole('button', { name: /exportar.*seleccionadas/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
    } else {
      // Exportar todas
      await page.getByRole('button', { name: /exportar/i }).click();
    }

    // Configurar exportación
    await expect(page.getByText(/opciones.*exportación/i)).toBeVisible();

    // Seleccionar campos
    const includeFlota = page.getByLabel(/incluir.*flota/i);
    if (await includeFlota.isVisible()) {
      await includeFlota.check();
    }

    const includeEmpleados = page.getByLabel(/incluir.*empleados/i);
    if (await includeEmpleados.isVisible()) {
      await includeEmpleados.check();
    }

    // Formato
    await page.getByLabel(/formato/i).selectOption('Excel');

    // Exportar
    await page
      .getByRole('button', { name: /exportar/i })
      .last()
      .click();
    await expect(page.getByText(/exportación.*iniciada/i)).toBeVisible();
  });
});
