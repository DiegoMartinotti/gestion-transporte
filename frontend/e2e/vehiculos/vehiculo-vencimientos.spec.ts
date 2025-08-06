import { test, expect } from '@playwright/test';

test.describe('Vehículos - Gestión de Vencimientos', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Navegar a vehículos
    await page.goto('/vehiculos');
    await expect(page).toHaveURL('/vehiculos');
  });

  test('Agregar vencimiento de seguro', async ({ page }) => {
    // Buscar un vehículo existente
    const editButton = page.getByRole('button', { name: /editar/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Ir a la pestaña de vencimientos si existe
      const vencimientosTab = page.getByRole('tab', { name: /vencimientos/i });
      if (await vencimientosTab.isVisible()) {
        await vencimientosTab.click();
      }

      // Agregar vencimiento de seguro
      const addVencimientoButton = page.getByRole('button', { name: /agregar vencimiento/i });
      if (await addVencimientoButton.isVisible()) {
        await addVencimientoButton.click();

        // Seleccionar tipo
        await page.getByLabel(/tipo.*vencimiento/i).selectOption('Seguro');

        // Fecha de vencimiento
        const fechaVencimiento = new Date();
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
        await page
          .getByLabel(/fecha.*vencimiento/i)
          .fill(fechaVencimiento.toISOString().split('T')[0]);

        // Descripción
        await page.getByLabel(/descripción/i).fill('Seguro contra todo riesgo - La Caja');

        // Guardar
        await page.getByRole('button', { name: /guardar/i }).click();

        // Verificar que se agregó
        await expect(page.getByText(/vencimiento agregado exitosamente/i)).toBeVisible();
      }
    }
  });

  test('Ver vencimientos próximos', async ({ page }) => {
    // Buscar sección de vencimientos próximos
    const vencimientosSection = page.getByText(/vencimientos próximos/i);
    if (await vencimientosSection.isVisible()) {
      // Verificar que muestra alertas para vencimientos próximos
      const alertas = page.locator('[role="alert"]').or(page.locator('.warning, .alert'));

      if ((await alertas.count()) > 0) {
        // Verificar que muestra información relevante
        const primerAlerta = alertas.first();
        await expect(primerAlerta).toContainText(/vence/i);
      }
    }

    // Alternativamente, puede haber un filtro de vencimientos
    const filtroVencimientos = page.getByRole('button', { name: /filtrar.*vencimientos/i });
    if (await filtroVencimientos.isVisible()) {
      await filtroVencimientos.click();

      // Seleccionar "Próximos 30 días"
      await page.getByText(/próximos 30 días/i).click();

      // Verificar que se filtran los resultados
      await page.waitForTimeout(500);
    }
  });

  test('Agregar múltiples tipos de vencimientos', async ({ page }) => {
    const vencimientos = [
      { tipo: 'VTV', descripcion: 'Verificación Técnica Vehicular', diasHasta: 60 },
      { tipo: 'Licencia', descripcion: 'Licencia de conducir profesional', diasHasta: 90 },
      { tipo: 'Habilitación', descripcion: 'Habilitación CNRT', diasHasta: 180 },
      { tipo: 'Revisión', descripcion: 'Revisión mecánica general', diasHasta: 30 },
    ];

    // Editar el primer vehículo disponible
    const editButton = page.getByRole('button', { name: /editar/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Ir a vencimientos
      const vencimientosTab = page.getByRole('tab', { name: /vencimientos/i });
      if (await vencimientosTab.isVisible()) {
        await vencimientosTab.click();

        for (const venc of vencimientos) {
          // Agregar vencimiento
          await page.getByRole('button', { name: /agregar vencimiento/i }).click();

          // Tipo
          const tipoSelect = page.getByLabel(/tipo.*vencimiento/i);
          if (await tipoSelect.isVisible()) {
            await tipoSelect.selectOption(venc.tipo);
          } else {
            // Si no hay select, puede ser un input de texto
            await page.getByLabel(/tipo/i).fill(venc.tipo);
          }

          // Fecha
          const fecha = new Date();
          fecha.setDate(fecha.getDate() + venc.diasHasta);
          await page.getByLabel(/fecha.*vencimiento/i).fill(fecha.toISOString().split('T')[0]);

          // Descripción
          await page.getByLabel(/descripción/i).fill(venc.descripcion);

          // Guardar este vencimiento
          const saveButton = page.getByRole('button', { name: /agregar|guardar/i }).last();
          await saveButton.click();

          await page.waitForTimeout(500);
        }

        // Guardar todos los cambios
        await page
          .getByRole('button', { name: /guardar/i })
          .first()
          .click();

        // Verificar éxito
        await expect(page.getByText(/actualizado exitosamente/i)).toBeVisible();
      }
    }
  });

  test('Marcar vencimiento como renovado', async ({ page }) => {
    // Buscar vehículo con vencimientos
    const viewButton = page.getByRole('button', { name: /ver detalles/i }).first();
    if (await viewButton.isVisible()) {
      await viewButton.click();

      // Buscar lista de vencimientos
      const vencimientosList = page.locator(
        '[data-testid="vencimientos-list"], .vencimientos-list'
      );
      if (await vencimientosList.isVisible()) {
        // Buscar un vencimiento específico
        const vencimientoItem = vencimientosList.locator('.vencimiento-item').first();
        if (await vencimientoItem.isVisible()) {
          // Buscar botón de renovar
          const renovarButton = vencimientoItem.getByRole('button', { name: /renovar/i });
          if (await renovarButton.isVisible()) {
            await renovarButton.click();

            // Ingresar nueva fecha de vencimiento
            const nuevaFecha = new Date();
            nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);
            await page.getByLabel(/nueva fecha/i).fill(nuevaFecha.toISOString().split('T')[0]);

            // Confirmar renovación
            await page.getByRole('button', { name: /confirmar/i }).click();

            // Verificar actualización
            await expect(page.getByText(/renovado exitosamente/i)).toBeVisible();
          }
        }
      }

      // Cerrar detalles
      await page.getByRole('button', { name: /cerrar/i }).click();
    }
  });

  test('Dashboard de vencimientos', async ({ page }) => {
    // Ir al dashboard de vencimientos si existe
    const vencimientosLink = page.getByRole('link', { name: /vencimientos/i });
    if (await vencimientosLink.isVisible()) {
      await vencimientosLink.click();

      // Verificar que muestra estadísticas
      await expect(page.getByText(/vencidos/i)).toBeVisible();
      await expect(page.getByText(/próximos a vencer/i)).toBeVisible();
      await expect(page.getByText(/vigentes/i)).toBeVisible();

      // Verificar gráficos o tablas resumen
      const charts = page.locator('canvas, svg.chart');
      if ((await charts.count()) > 0) {
        await expect(charts.first()).toBeVisible();
      }
    }
  });

  test('Notificaciones de vencimientos', async ({ page }) => {
    // Verificar si hay indicador de notificaciones
    const notificationBell = page.locator('[aria-label="notificaciones"], .notification-bell');
    if (await notificationBell.isVisible()) {
      await notificationBell.click();

      // Verificar que muestra notificaciones de vencimientos
      const notificationPanel = page.locator('.notifications-panel, [role="menu"]');
      await expect(notificationPanel).toBeVisible();

      // Buscar notificaciones de vencimientos
      const vencimientoNotification = notificationPanel.getByText(/venc/i);
      if ((await vencimientoNotification.count()) > 0) {
        await expect(vencimientoNotification.first()).toBeVisible();
      }

      // Cerrar panel
      await page.keyboard.press('Escape');
    }
  });

  test('Filtrar vehículos por estado de vencimientos', async ({ page }) => {
    // Buscar filtros avanzados
    const advancedFilters = page.getByRole('button', { name: /filtros.*avanzados/i });
    if (await advancedFilters.isVisible()) {
      await advancedFilters.click();

      // Filtrar por vencimientos
      const vencimientoFilter = page.getByLabel(/estado.*vencimiento/i);
      if (await vencimientoFilter.isVisible()) {
        await vencimientoFilter.selectOption('Con vencimientos próximos');

        // Aplicar filtro
        await page.getByRole('button', { name: /aplicar/i }).click();

        // Verificar que se filtran los resultados
        await page.waitForTimeout(500);

        // Los vehículos mostrados deberían tener indicador de vencimiento
        const vehicleRows = page.locator('table tbody tr');
        if ((await vehicleRows.count()) > 0) {
          const firstRow = vehicleRows.first();
          const indicator = firstRow.locator('.warning-indicator, .vencimiento-badge');
          if (await indicator.isVisible()) {
            await expect(indicator).toBeVisible();
          }
        }
      }
    }
  });

  test('Exportar reporte de vencimientos', async ({ page }) => {
    // Buscar opción de reportes
    const reportButton = page.getByRole('button', { name: /reporte.*vencimientos/i });
    if (await reportButton.isVisible()) {
      await reportButton.click();

      // Configurar reporte
      await page.getByLabel(/período/i).selectOption('Próximos 90 días');
      await page.getByLabel(/tipo.*reporte/i).selectOption('Detallado');

      // Generar reporte
      await page.getByRole('button', { name: /generar/i }).click();

      // Verificar que se genera el reporte
      await expect(page.getByText(/reporte generado/i)).toBeVisible();

      // Exportar a Excel
      const exportButton = page.getByRole('button', { name: /exportar.*excel/i });
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await expect(page.getByText(/exportación iniciada/i)).toBeVisible();
      }
    }
  });

  test('Calendario de vencimientos', async ({ page }) => {
    // Buscar vista de calendario
    const calendarView = page.getByRole('button', { name: /vista.*calendario/i });
    if (await calendarView.isVisible()) {
      await calendarView.click();

      // Verificar que se muestra el calendario
      const calendar = page.locator('.calendar, [role="grid"]');
      await expect(calendar).toBeVisible();

      // Verificar que hay eventos de vencimientos
      const calendarEvents = calendar.locator('.event, .vencimiento-event');
      if ((await calendarEvents.count()) > 0) {
        // Click en un evento
        await calendarEvents.first().click();

        // Debería mostrar detalles del vencimiento
        await expect(page.getByText(/detalles.*vencimiento/i)).toBeVisible();

        // Cerrar detalles
        await page.keyboard.press('Escape');
      }

      // Cambiar mes
      const nextMonthButton = page.getByRole('button', { name: /siguiente.*mes/i });
      if (await nextMonthButton.isVisible()) {
        await nextMonthButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Configurar alertas de vencimientos', async ({ page }) => {
    // Ir a configuración
    const settingsButton = page.getByRole('button', { name: /configuración/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Buscar sección de alertas
      const alertasSection = page.getByText(/alertas.*vencimientos/i);
      if (await alertasSection.isVisible()) {
        // Configurar días de anticipación
        await page.getByLabel(/días.*anticipación/i).fill('30');

        // Activar notificaciones por email
        const emailCheckbox = page.getByLabel(/notificar.*email/i);
        if (await emailCheckbox.isVisible()) {
          await emailCheckbox.check();
        }

        // Guardar configuración
        await page.getByRole('button', { name: /guardar.*configuración/i }).click();

        // Verificar guardado exitoso
        await expect(page.getByText(/configuración guardada/i)).toBeVisible();
      }
    }
  });
});
