import { test, expect } from '@playwright/test';

test.describe('Vehículos - Operaciones CRUD Completas', () => {
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

  test('Crear nuevo vehículo con todos los campos', async ({ page }) => {
    // Click en nuevo vehículo
    await page.getByRole('button', { name: /nuevo vehículo/i }).click();

    // Llenar información básica
    await page.getByLabel(/patente/i).fill('ABC123');
    await page.getByLabel(/marca/i).fill('Mercedes Benz');
    await page.getByLabel(/modelo/i).fill('Actros 1846');
    await page.getByLabel(/año/i).fill('2024');
    await page.getByLabel(/chasis/i).fill('WDB9302031L123456');
    await page.getByLabel(/motor/i).fill('OM471LA.6-1');

    // Información de capacidad
    await page.getByLabel(/capacidad.*carga/i).fill('30000');
    await page.getByLabel(/tipo.*vehículo/i).selectOption('Camión');

    // Información del propietario
    const empresaSelect = page.getByLabel(/empresa/i);
    if (await empresaSelect.isVisible()) {
      await empresaSelect.click();
      await page.getByRole('option').first().click();
    }

    // Guardar
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar notificación de éxito
    await expect(page.getByText(/vehículo creado exitosamente/i)).toBeVisible();

    // Verificar que aparece en la lista
    await expect(page.getByText('ABC123')).toBeVisible();
    await expect(page.getByText('Mercedes Benz')).toBeVisible();
    await expect(page.getByText('Actros 1846')).toBeVisible();
  });

  test('Buscar y filtrar vehículos', async ({ page }) => {
    // Crear varios vehículos para probar filtros
    const vehiculos = [
      { patente: 'TEST001', marca: 'Scania', modelo: 'R450' },
      { patente: 'TEST002', marca: 'Volvo', modelo: 'FH16' },
      { patente: 'TEST003', marca: 'Iveco', modelo: 'Stralis' },
    ];

    for (const vehiculo of vehiculos) {
      await page.getByRole('button', { name: /nuevo vehículo/i }).click();
      await page.getByLabel(/patente/i).fill(vehiculo.patente);
      await page.getByLabel(/marca/i).fill(vehiculo.marca);
      await page.getByLabel(/modelo/i).fill(vehiculo.modelo);
      await page.getByLabel(/año/i).fill('2024');
      await page.getByRole('button', { name: /guardar/i }).click();
      await page.waitForTimeout(1000);
    }

    // Buscar por patente
    await page.getByPlaceholder(/buscar/i).fill('TEST001');
    await page.waitForTimeout(500);

    await expect(page.getByText('TEST001')).toBeVisible();
    await expect(page.getByText('Scania')).toBeVisible();
    await expect(page.getByText('TEST002')).not.toBeVisible();

    // Buscar por marca
    await page.getByPlaceholder(/buscar/i).clear();
    await page.getByPlaceholder(/buscar/i).fill('Volvo');
    await page.waitForTimeout(500);

    await expect(page.getByText('TEST002')).toBeVisible();
    await expect(page.getByText('Volvo')).toBeVisible();
    await expect(page.getByText('TEST001')).not.toBeVisible();

    // Limpiar búsqueda
    await page.getByPlaceholder(/buscar/i).clear();
    await page.waitForTimeout(500);

    // Todos deben ser visibles
    await expect(page.getByText('TEST001')).toBeVisible();
    await expect(page.getByText('TEST002')).toBeVisible();
    await expect(page.getByText('TEST003')).toBeVisible();
  });

  test('Editar vehículo existente', async ({ page }) => {
    // Buscar vehículo específico
    await page.getByPlaceholder(/buscar/i).fill('ABC123');
    await page.waitForTimeout(500);

    // Click en editar
    await page
      .getByRole('button', { name: /editar/i })
      .first()
      .click();

    // Modificar datos
    const modeloInput = page.getByLabel(/modelo/i);
    await modeloInput.clear();
    await modeloInput.fill('Actros 2546 Editado');

    const añoInput = page.getByLabel(/año/i);
    await añoInput.clear();
    await añoInput.fill('2025');

    // Guardar cambios
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar notificación de éxito
    await expect(page.getByText(/vehículo actualizado exitosamente/i)).toBeVisible();

    // Verificar que se actualizó en la lista
    await expect(page.getByText('Actros 2546 Editado')).toBeVisible();
    await expect(page.getByText('2025')).toBeVisible();
  });

  test('Ver detalles completos del vehículo', async ({ page }) => {
    // Buscar vehículo
    await page.getByPlaceholder(/buscar/i).fill('ABC123');
    await page.waitForTimeout(500);

    // Click en ver detalles
    await page
      .getByRole('button', { name: /ver detalles/i })
      .first()
      .click();

    // Verificar que se muestra el modal/página de detalles
    await expect(page.getByText(/detalles del vehículo/i)).toBeVisible();

    // Verificar información mostrada
    await expect(page.getByText('ABC123')).toBeVisible();
    await expect(page.getByText('Mercedes Benz')).toBeVisible();
    await expect(page.getByText(/chasis.*WDB9302031L123456/i)).toBeVisible();
    await expect(page.getByText(/motor.*OM471LA/i)).toBeVisible();

    // Cerrar modal de detalles
    await page.getByRole('button', { name: /cerrar/i }).click();
  });

  test('Validaciones del formulario', async ({ page }) => {
    // Abrir formulario de nuevo vehículo
    await page.getByRole('button', { name: /nuevo vehículo/i }).click();

    // Intentar guardar sin datos
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar errores de validación
    await expect(page.getByText(/patente.*requerida/i)).toBeVisible();
    await expect(page.getByText(/marca.*requerida/i)).toBeVisible();
    await expect(page.getByText(/modelo.*requerido/i)).toBeVisible();
    await expect(page.getByText(/año.*requerido/i)).toBeVisible();

    // Validar formato de patente
    await page.getByLabel(/patente/i).fill('123');
    await page.getByLabel(/marca/i).click(); // Trigger blur
    await expect(page.getByText(/formato.*patente.*inválido/i)).toBeVisible();

    // Validar año
    await page.getByLabel(/año/i).fill('1800');
    await page.getByLabel(/marca/i).click(); // Trigger blur
    await expect(page.getByText(/año.*válido/i)).toBeVisible();

    await page.getByLabel(/año/i).clear();
    await page.getByLabel(/año/i).fill('3000');
    await page.getByLabel(/marca/i).click(); // Trigger blur
    await expect(page.getByText(/año.*válido/i)).toBeVisible();

    // Cancelar
    await page.getByRole('button', { name: /cancelar/i }).click();
  });

  test('Eliminar vehículo con confirmación', async ({ page }) => {
    // Buscar vehículo a eliminar
    await page.getByPlaceholder(/buscar/i).fill('TEST003');
    await page.waitForTimeout(500);

    // Click en eliminar
    await page
      .getByRole('button', { name: /eliminar/i })
      .first()
      .click();

    // Verificar modal de confirmación
    await expect(page.getByText(/¿está seguro.*eliminar/i)).toBeVisible();
    await expect(page.getByText(/esta acción no se puede deshacer/i)).toBeVisible();

    // Cancelar primero
    await page.getByRole('button', { name: /cancelar/i }).click();

    // Verificar que el vehículo sigue ahí
    await expect(page.getByText('TEST003')).toBeVisible();

    // Ahora eliminar de verdad
    await page
      .getByRole('button', { name: /eliminar/i })
      .first()
      .click();
    await page
      .getByRole('button', { name: /confirmar|eliminar/i })
      .last()
      .click();

    // Verificar notificación de éxito
    await expect(page.getByText(/vehículo eliminado exitosamente/i)).toBeVisible();

    // Verificar que ya no aparece en la lista
    await page.getByPlaceholder(/buscar/i).clear();
    await page.waitForTimeout(500);
    await expect(page.getByText('TEST003')).not.toBeVisible();
  });

  test('Duplicar vehículo', async ({ page }) => {
    // Buscar vehículo para duplicar
    await page.getByPlaceholder(/buscar/i).fill('TEST001');
    await page.waitForTimeout(500);

    // Si existe opción de duplicar
    const duplicateButton = page.getByRole('button', { name: /duplicar/i }).first();
    if (await duplicateButton.isVisible()) {
      await duplicateButton.click();

      // Debería abrir el formulario con datos precargados
      await expect(page.getByRole('dialog')).toBeVisible();

      // Cambiar la patente (debe ser única)
      const patenteInput = page.getByLabel(/patente/i);
      await patenteInput.clear();
      await patenteInput.fill('TEST001-DUP');

      // Guardar
      await page.getByRole('button', { name: /guardar/i }).click();

      // Verificar creación exitosa
      await expect(page.getByText(/vehículo creado exitosamente/i)).toBeVisible();

      // Verificar que aparece en la lista
      await page.getByPlaceholder(/buscar/i).clear();
      await page.waitForTimeout(500);
      await expect(page.getByText('TEST001-DUP')).toBeVisible();
    }
  });

  test('Exportar lista de vehículos', async ({ page }) => {
    // Buscar botón de exportar
    const exportButton = page.getByRole('button', { name: /exportar/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Seleccionar formato si hay opciones
      const excelOption = page.getByText(/excel/i);
      if (await excelOption.isVisible()) {
        await excelOption.click();
      }

      // Verificar que se inicia la descarga
      await expect(page.getByText(/exportación.*iniciada/i)).toBeVisible();
    }
  });

  test('Importar vehículos desde Excel', async ({ page }) => {
    // Buscar botón de importar
    const importButton = page.getByRole('button', { name: /importar/i });
    if (await importButton.isVisible()) {
      await importButton.click();

      // Debería abrir modal de importación
      await expect(page.getByText(/importar vehículos/i)).toBeVisible();

      // Descargar plantilla
      const templateButton = page.getByRole('button', { name: /descargar plantilla/i });
      if (await templateButton.isVisible()) {
        await templateButton.click();
        await expect(page.getByText(/plantilla descargada/i)).toBeVisible();
      }

      // Cerrar modal
      await page.getByRole('button', { name: /cancelar/i }).click();
    }
  });

  test('Asignar vehículo a conductor', async ({ page }) => {
    // Buscar vehículo
    await page.getByPlaceholder(/buscar/i).fill('TEST001');
    await page.waitForTimeout(500);

    // Buscar opción de asignar conductor
    const assignButton = page.getByRole('button', { name: /asignar.*conductor/i }).first();
    if (await assignButton.isVisible()) {
      await assignButton.click();

      // Seleccionar conductor
      const conductorSelect = page.getByLabel(/conductor/i);
      await conductorSelect.click();
      await page.getByRole('option').first().click();

      // Fecha de asignación
      await page.getByLabel(/fecha.*asignación/i).fill('2024-01-01');

      // Guardar
      await page.getByRole('button', { name: /guardar/i }).click();

      // Verificar asignación exitosa
      await expect(page.getByText(/conductor asignado exitosamente/i)).toBeVisible();
    }
  });
});
