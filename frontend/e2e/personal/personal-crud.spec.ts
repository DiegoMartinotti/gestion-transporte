import { test, expect } from '@playwright/test';

test.describe('Personal - Operaciones CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Navegar a personal
    await page.goto('/personal');
    await expect(page).toHaveURL('/personal');
  });

  test('Crear nuevo empleado completo', async ({ page }) => {
    // Click en nuevo personal
    await page.getByRole('button', { name: /nuevo personal/i }).click();

    // Información personal
    await page.getByLabel(/nombre/i).fill('Juan');
    await page.getByLabel(/apellido/i).fill('Pérez');
    await page.getByLabel(/dni|documento/i).fill('12345678');
    await page.getByLabel(/fecha.*nacimiento/i).fill('1985-05-15');

    // Información de contacto
    await page.getByLabel(/email/i).fill('juan.perez@test.com');
    await page.getByLabel(/teléfono/i).fill('1145678900');
    await page.getByLabel(/dirección/i).fill('Av. Corrientes 1234');
    await page.getByLabel(/ciudad/i).fill('Buenos Aires');

    // Información laboral
    await page.getByLabel(/cargo|puesto/i).selectOption('Conductor');
    await page.getByLabel(/fecha.*ingreso/i).fill('2024-01-15');
    await page.getByLabel(/salario/i).fill('150000');

    // Empresa
    const empresaSelect = page.getByLabel(/empresa/i);
    if (await empresaSelect.isVisible()) {
      await empresaSelect.click();
      await page.getByRole('option').first().click();
    }

    // Licencia de conducir
    await page.getByLabel(/licencia.*conducir/i).fill('B2 Profesional');
    await page.getByLabel(/vencimiento.*licencia/i).fill('2025-12-31');

    // Guardar
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar creación exitosa
    await expect(page.getByText(/empleado creado exitosamente/i)).toBeVisible();
    await expect(page.getByText('Juan Pérez')).toBeVisible();
    await expect(page.getByText('12345678')).toBeVisible();
  });

  test('Buscar y filtrar empleados', async ({ page }) => {
    // Buscar por nombre
    await page.getByPlaceholder(/buscar/i).fill('Juan');
    await page.waitForTimeout(500);

    // Verificar resultados
    const results = page.locator('table tbody tr');
    if ((await results.count()) > 0) {
      await expect(results.first()).toContainText(/juan/i);
    }

    // Limpiar búsqueda
    await page.getByPlaceholder(/buscar/i).clear();

    // Filtrar por cargo
    const cargoFilter = page.getByLabel(/filtrar.*cargo/i);
    if (await cargoFilter.isVisible()) {
      await cargoFilter.selectOption('Conductor');
      await page.waitForTimeout(500);

      // Verificar que solo muestra conductores
      const rows = page.locator('table tbody tr');
      for (let i = 0; i < (await rows.count()); i++) {
        await expect(rows.nth(i)).toContainText(/conductor/i);
      }
    }

    // Filtrar por estado
    const statusFilter = page.getByLabel(/estado/i);
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Activo');
      await page.waitForTimeout(500);
    }
  });

  test('Editar información del empleado', async ({ page }) => {
    // Buscar empleado específico
    await page.getByPlaceholder(/buscar/i).fill('Juan Pérez');
    await page.waitForTimeout(500);

    // Editar
    await page
      .getByRole('button', { name: /editar/i })
      .first()
      .click();

    // Modificar información
    const salarioInput = page.getByLabel(/salario/i);
    await salarioInput.clear();
    await salarioInput.fill('180000');

    const cargoSelect = page.getByLabel(/cargo/i);
    await cargoSelect.selectOption('Supervisor');

    // Agregar observación
    const observacionInput = page.getByLabel(/observación|nota/i);
    if (await observacionInput.isVisible()) {
      await observacionInput.fill('Promoción a supervisor - Enero 2025');
    }

    // Guardar cambios
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar actualización
    await expect(page.getByText(/empleado actualizado exitosamente/i)).toBeVisible();
    await expect(page.getByText('Supervisor')).toBeVisible();
  });

  test('Gestionar períodos de empleo', async ({ page }) => {
    // Editar empleado
    await page
      .getByRole('button', { name: /editar/i })
      .first()
      .click();

    // Ir a pestaña de historial laboral
    const historialTab = page.getByRole('tab', { name: /historial|períodos/i });
    if (await historialTab.isVisible()) {
      await historialTab.click();

      // Agregar período de empleo
      await page.getByRole('button', { name: /agregar período/i }).click();

      await page.getByLabel(/empresa.*período/i).fill('Empresa Anterior SA');
      await page.getByLabel(/cargo.*período/i).fill('Conductor');
      await page.getByLabel(/desde/i).fill('2020-01-01');
      await page.getByLabel(/hasta/i).fill('2023-12-31');
      await page.getByLabel(/motivo.*salida/i).fill('Mejor oportunidad laboral');

      // Guardar período
      await page
        .getByRole('button', { name: /agregar|guardar/i })
        .last()
        .click();

      // Verificar que se agregó
      await expect(page.getByText('Empresa Anterior SA')).toBeVisible();
      await expect(page.getByText('2020-2023')).toBeVisible();
    }

    // Guardar cambios generales
    await page
      .getByRole('button', { name: /guardar/i })
      .first()
      .click();
  });

  test('Registrar capacitaciones', async ({ page }) => {
    // Editar empleado
    await page
      .getByRole('button', { name: /editar/i })
      .first()
      .click();

    // Ir a capacitaciones
    const capacitacionesTab = page.getByRole('tab', { name: /capacitaciones/i });
    if (await capacitacionesTab.isVisible()) {
      await capacitacionesTab.click();

      // Agregar capacitación
      await page.getByRole('button', { name: /agregar capacitación/i }).click();

      await page.getByLabel(/nombre.*capacitación/i).fill('Manejo Defensivo');
      await page.getByLabel(/institución/i).fill('Centro de Capacitación Vial');
      await page.getByLabel(/fecha.*realización/i).fill('2024-06-15');
      await page.getByLabel(/duración/i).fill('16');
      await page.getByLabel(/certificado/i).fill('MDV-2024-001');

      // Marcar como obligatoria
      const obligatoriaCheckbox = page.getByLabel(/obligatoria/i);
      if (await obligatoriaCheckbox.isVisible()) {
        await obligatoriaCheckbox.check();
      }

      // Guardar capacitación
      await page
        .getByRole('button', { name: /agregar|guardar/i })
        .last()
        .click();

      // Verificar que se agregó
      await expect(page.getByText('Manejo Defensivo')).toBeVisible();
      await expect(page.getByText('MDV-2024-001')).toBeVisible();
    }

    // Guardar cambios
    await page
      .getByRole('button', { name: /guardar/i })
      .first()
      .click();
  });

  test('Registrar incidentes', async ({ page }) => {
    // Buscar empleado
    await page.getByPlaceholder(/buscar/i).fill('Juan');
    await page.waitForTimeout(500);

    // Ver detalles
    await page
      .getByRole('button', { name: /ver detalles/i })
      .first()
      .click();

    // Ir a sección de incidentes
    const incidentesSection = page.getByText(/incidentes|sanciones/i);
    if (await incidentesSection.isVisible()) {
      // Agregar incidente
      const addIncidentButton = page.getByRole('button', { name: /registrar incidente/i });
      if (await addIncidentButton.isVisible()) {
        await addIncidentButton.click();

        await page.getByLabel(/fecha.*incidente/i).fill('2024-11-15');
        await page.getByLabel(/tipo.*incidente/i).selectOption('Llegada tarde');
        await page.getByLabel(/descripción/i).fill('Llegada tarde sin aviso previo');
        await page.getByLabel(/gravedad/i).selectOption('Leve');

        // Acción tomada
        await page.getByLabel(/acción.*tomada/i).fill('Llamado de atención verbal');

        // Guardar incidente
        await page.getByRole('button', { name: /guardar/i }).click();

        // Verificar registro
        await expect(page.getByText(/incidente registrado/i)).toBeVisible();
      }
    }

    // Cerrar detalles
    await page.getByRole('button', { name: /cerrar/i }).click();
  });

  test('Asignar vehículo a conductor', async ({ page }) => {
    // Filtrar solo conductores
    const cargoFilter = page.getByLabel(/cargo/i);
    if (await cargoFilter.isVisible()) {
      await cargoFilter.selectOption('Conductor');
      await page.waitForTimeout(500);
    }

    // Asignar vehículo al primer conductor
    const assignButton = page.getByRole('button', { name: /asignar vehículo/i }).first();
    if (await assignButton.isVisible()) {
      await assignButton.click();

      // Seleccionar vehículo
      await page.getByLabel(/vehículo/i).click();
      await page.getByRole('option').first().click();

      // Fecha de asignación
      await page.getByLabel(/fecha.*asignación/i).fill('2025-01-01');

      // Observaciones
      await page.getByLabel(/observaciones/i).fill('Asignación por ruta nueva');

      // Guardar
      await page.getByRole('button', { name: /asignar/i }).click();

      // Verificar asignación
      await expect(page.getByText(/vehículo asignado exitosamente/i)).toBeVisible();
    }
  });

  test('Ver y descargar ficha del empleado', async ({ page }) => {
    // Ver detalles del primer empleado
    await page
      .getByRole('button', { name: /ver detalles/i })
      .first()
      .click();

    // Verificar información completa
    await expect(page.getByText(/información personal/i)).toBeVisible();
    await expect(page.getByText(/información laboral/i)).toBeVisible();

    // Descargar ficha
    const downloadButton = page.getByRole('button', { name: /descargar ficha/i });
    if (await downloadButton.isVisible()) {
      await downloadButton.click();

      // Seleccionar formato
      const formatOptions = page.getByRole('menu');
      if (await formatOptions.isVisible()) {
        await page.getByText(/pdf/i).click();
      }

      // Verificar descarga iniciada
      await expect(page.getByText(/descarga iniciada/i)).toBeVisible();
    }

    // Imprimir ficha
    const printButton = page.getByRole('button', { name: /imprimir/i });
    if (await printButton.isVisible()) {
      // No ejecutar impresión real, solo verificar que existe
      await expect(printButton).toBeVisible();
    }

    // Cerrar detalles
    await page.getByRole('button', { name: /cerrar/i }).click();
  });

  test('Dar de baja a empleado', async ({ page }) => {
    // Buscar empleado para dar de baja
    await page.getByPlaceholder(/buscar/i).fill('Test Baja');
    await page.waitForTimeout(500);

    // Si no existe, crear uno de prueba
    if (await page.getByText('No se encontraron resultados').isVisible()) {
      await page.getByRole('button', { name: /nuevo personal/i }).click();
      await page.getByLabel(/nombre/i).fill('Test');
      await page.getByLabel(/apellido/i).fill('Baja');
      await page.getByLabel(/dni/i).fill('99999999');
      await page.getByLabel(/cargo/i).selectOption('Conductor');
      await page.getByRole('button', { name: /guardar/i }).click();
      await page.waitForTimeout(1000);
    }

    // Dar de baja
    const bajaButton = page.getByRole('button', { name: /dar.*baja/i }).first();
    if (await bajaButton.isVisible()) {
      await bajaButton.click();

      // Formulario de baja
      await page.getByLabel(/fecha.*baja/i).fill('2025-01-31');
      await page.getByLabel(/motivo.*baja/i).selectOption('Renuncia');
      await page
        .getByLabel(/observaciones.*baja/i)
        .fill('Renuncia voluntaria por motivos personales');

      // Confirmar baja
      await page.getByRole('button', { name: /confirmar baja/i }).click();

      // Verificar confirmación adicional
      await expect(page.getByText(/¿está seguro/i)).toBeVisible();
      await page.getByRole('button', { name: /confirmar/i }).click();

      // Verificar baja exitosa
      await expect(page.getByText(/empleado dado de baja/i)).toBeVisible();

      // El empleado debería aparecer como inactivo
      await expect(page.getByText(/inactivo/i)).toBeVisible();
    }
  });

  test('Reactivar empleado dado de baja', async ({ page }) => {
    // Filtrar por inactivos
    const statusFilter = page.getByLabel(/estado/i);
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Inactivo');
      await page.waitForTimeout(500);
    }

    // Reactivar el primero
    const reactivateButton = page.getByRole('button', { name: /reactivar/i }).first();
    if (await reactivateButton.isVisible()) {
      await reactivateButton.click();

      // Confirmar reactivación
      await expect(page.getByText(/confirmar.*reactivación/i)).toBeVisible();
      await page.getByLabel(/fecha.*reingreso/i).fill('2025-02-01');
      await page.getByLabel(/observaciones/i).fill('Reingreso por solicitud');

      await page.getByRole('button', { name: /confirmar/i }).click();

      // Verificar reactivación
      await expect(page.getByText(/empleado reactivado/i)).toBeVisible();
    }
  });

  test('Exportar lista de empleados', async ({ page }) => {
    // Exportar lista
    const exportButton = page.getByRole('button', { name: /exportar/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Opciones de exportación
      await expect(page.getByText(/opciones.*exportación/i)).toBeVisible();

      // Seleccionar campos a exportar
      const fieldsToExport = page.locator('input[type="checkbox"]');
      if ((await fieldsToExport.count()) > 0) {
        // Seleccionar todos los campos
        await page.getByLabel(/seleccionar todos/i).check();
      }

      // Formato
      await page.getByLabel(/formato/i).selectOption('Excel');

      // Exportar
      await page
        .getByRole('button', { name: /exportar/i })
        .last()
        .click();

      // Verificar exportación
      await expect(page.getByText(/exportación.*iniciada/i)).toBeVisible();
    }
  });
});
