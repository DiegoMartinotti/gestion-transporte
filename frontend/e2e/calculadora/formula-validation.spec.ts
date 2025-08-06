import { test, expect } from '@playwright/test';

test.describe('Calculadora - Validación de Fórmulas', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Navegar a configuración de fórmulas
    await page.goto('/configuracion/formulas');
  });

  test('Crear fórmula básica', async ({ page }) => {
    // Crear nueva fórmula
    await page.getByRole('button', { name: /nueva fórmula/i }).click();

    // Nombre y descripción
    await page.getByLabel(/nombre/i).fill('Tarifa Express');
    await page.getByLabel(/descripción/i).fill('Fórmula para envíos express');

    // Seleccionar cliente
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();

    // Ingresar fórmula
    await page.getByLabel(/fórmula/i).fill('distancia * 150 + peso * 50');

    // Variables disponibles
    const variablesSection = page.getByText(/variables disponibles/i);
    if (await variablesSection.isVisible()) {
      await expect(page.getByText(/distancia/i)).toBeVisible();
      await expect(page.getByText(/peso/i)).toBeVisible();
      await expect(page.getByText(/camiones/i)).toBeVisible();
    }

    // Validar fórmula
    await page.getByRole('button', { name: /validar/i }).click();

    // Verificar validación exitosa
    await expect(page.getByText(/fórmula válida/i)).toBeVisible();

    // Guardar
    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/fórmula creada exitosamente/i)).toBeVisible();
  });

  test('Validar sintaxis de fórmula incorrecta', async ({ page }) => {
    await page.getByRole('button', { name: /nueva fórmula/i }).click();

    // Fórmula con sintaxis incorrecta
    await page.getByLabel(/fórmula/i).fill('distancia ** + peso');

    // Validar
    await page.getByRole('button', { name: /validar/i }).click();

    // Verificar error de sintaxis
    await expect(page.getByText(/error.*sintaxis/i)).toBeVisible();
    await expect(page.getByText(/posición|línea|carácter/i)).toBeVisible();

    // Corregir fórmula
    await page.getByLabel(/fórmula/i).clear();
    await page.getByLabel(/fórmula/i).fill('distancia * 100 + peso * 50');

    // Validar nuevamente
    await page.getByRole('button', { name: /validar/i }).click();
    await expect(page.getByText(/fórmula válida/i)).toBeVisible();
  });

  test('Usar funciones matemáticas en fórmulas', async ({ page }) => {
    await page.getByRole('button', { name: /nueva fórmula/i }).click();

    // Fórmula con funciones matemáticas
    const formulas = [
      'max(distancia * 100, 5000)', // Mínimo de 5000
      'min(peso * 200, 50000)', // Máximo de 50000
      'round(distancia * 123.45)', // Redondear
      'ceil(peso / 1000) * 1000', // Redondear hacia arriba
      'sqrt(distancia) * 1000', // Raíz cuadrada
    ];

    for (const formula of formulas) {
      await page.getByLabel(/fórmula/i).clear();
      await page.getByLabel(/fórmula/i).fill(formula);

      await page.getByRole('button', { name: /validar/i }).click();
      await expect(page.getByText(/fórmula válida/i)).toBeVisible();
    }

    // Verificar ayuda de funciones
    const helpButton = page.getByRole('button', { name: /ayuda.*funciones/i });
    if (await helpButton.isVisible()) {
      await helpButton.click();

      // Debería mostrar lista de funciones disponibles
      await expect(page.getByText(/funciones disponibles/i)).toBeVisible();
      await expect(page.getByText(/max\(/i)).toBeVisible();
      await expect(page.getByText(/min\(/i)).toBeVisible();
      await expect(page.getByText(/round\(/i)).toBeVisible();

      // Cerrar ayuda
      await page.keyboard.press('Escape');
    }
  });

  test('Fórmulas condicionales', async ({ page }) => {
    await page.getByRole('button', { name: /nueva fórmula/i }).click();

    // Fórmula con condiciones
    const conditionalFormula = `
      peso > 1000 ? 
        distancia * 200 : 
        distancia * 150
    `;

    await page.getByLabel(/fórmula/i).fill(conditionalFormula);

    // Validar
    await page.getByRole('button', { name: /validar/i }).click();
    await expect(page.getByText(/fórmula válida/i)).toBeVisible();

    // Probar con múltiples condiciones
    const complexFormula = `
      peso > 5000 ? distancia * 300 :
      peso > 1000 ? distancia * 200 :
      distancia * 150
    `;

    await page.getByLabel(/fórmula/i).clear();
    await page.getByLabel(/fórmula/i).fill(complexFormula);

    await page.getByRole('button', { name: /validar/i }).click();
    await expect(page.getByText(/fórmula válida/i)).toBeVisible();
  });

  test('Probar fórmula con valores de ejemplo', async ({ page }) => {
    await page.getByRole('button', { name: /nueva fórmula/i }).click();

    // Ingresar fórmula
    await page.getByLabel(/fórmula/i).fill('distancia * 120 + peso * 45 + camiones * 5000');

    // Abrir probador de fórmula
    const testButton = page.getByRole('button', { name: /probar fórmula/i });
    await testButton.click();

    // Ingresar valores de prueba
    await page.getByLabel(/distancia.*prueba/i).fill('100');
    await page.getByLabel(/peso.*prueba/i).fill('500');
    await page.getByLabel(/camiones.*prueba/i).fill('2');

    // Calcular
    await page.getByRole('button', { name: /calcular.*prueba/i }).click();

    // Verificar resultado
    await expect(page.getByText(/resultado.*prueba/i)).toBeVisible();
    // 100 * 120 + 500 * 45 + 2 * 5000 = 12000 + 22500 + 10000 = 44500
    await expect(page.getByText(/44.*500/)).toBeVisible();

    // Verificar desglose del cálculo
    const breakdown = page.getByText(/desglose.*cálculo/i);
    if (await breakdown.isVisible()) {
      await expect(page.getByText(/distancia.*100.*120/i)).toBeVisible();
      await expect(page.getByText(/peso.*500.*45/i)).toBeVisible();
      await expect(page.getByText(/camiones.*2.*5000/i)).toBeVisible();
    }
  });

  test('Importar y exportar fórmulas', async ({ page }) => {
    // Exportar fórmulas existentes
    const exportButton = page.getByRole('button', { name: /exportar fórmulas/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Seleccionar formato
      await page.getByLabel(/formato/i).selectOption('JSON');

      // Descargar
      await page.getByRole('button', { name: /descargar/i }).click();
      await expect(page.getByText(/fórmulas exportadas/i)).toBeVisible();
    }

    // Importar fórmulas
    const importButton = page.getByRole('button', { name: /importar fórmulas/i });
    if (await importButton.isVisible()) {
      await importButton.click();

      // Verificar zona de carga
      const dropZone = page.locator('[data-testid="formula-drop-zone"]');
      await expect(dropZone).toBeVisible();

      // Verificar validación al importar
      const validateOnImport = page.getByLabel(/validar al importar/i);
      if (await validateOnImport.isVisible()) {
        await validateOnImport.check();
      }

      // Cancelar por ahora
      await page.getByRole('button', { name: /cancelar/i }).click();
    }
  });

  test('Historial de cambios en fórmulas', async ({ page }) => {
    // Editar una fórmula existente
    const editButton = page.getByRole('button', { name: /editar/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Modificar fórmula
      const formulaInput = page.getByLabel(/fórmula/i);
      const currentFormula = await formulaInput.inputValue();
      await formulaInput.clear();
      await formulaInput.fill(currentFormula + ' + 1000');

      // Agregar nota de cambio
      const changeNote = page.getByLabel(/nota.*cambio/i);
      if (await changeNote.isVisible()) {
        await changeNote.fill('Agregado cargo fijo de 1000');
      }

      // Guardar
      await page.getByRole('button', { name: /guardar/i }).click();

      // Ver historial
      const historyButton = page.getByRole('button', { name: /ver historial/i });
      if (await historyButton.isVisible()) {
        await historyButton.click();

        // Verificar que muestra el cambio
        await expect(page.getByText(/historial.*cambios/i)).toBeVisible();
        await expect(page.getByText(/agregado cargo fijo/i)).toBeVisible();

        // Verificar que muestra versión anterior
        await expect(page.getByText(/versión anterior/i)).toBeVisible();

        // Opción de revertir
        const revertButton = page.getByRole('button', { name: /revertir/i });
        if (await revertButton.isVisible()) {
          // No revertir realmente, solo verificar que existe
          await expect(revertButton).toBeVisible();
        }

        // Cerrar historial
        await page.getByRole('button', { name: /cerrar/i }).click();
      }
    }
  });

  test('Clonar fórmula existente', async ({ page }) => {
    // Buscar fórmula para clonar
    const cloneButton = page.getByRole('button', { name: /clonar/i }).first();
    if (await cloneButton.isVisible()) {
      await cloneButton.click();

      // Debería abrir formulario con datos precargados
      const nameInput = page.getByLabel(/nombre/i);
      const currentName = await nameInput.inputValue();

      // Cambiar nombre
      await nameInput.clear();
      await nameInput.fill(currentName + ' - Copia');

      // Modificar ligeramente la fórmula
      const formulaInput = page.getByLabel(/fórmula/i);
      const currentFormula = await formulaInput.inputValue();
      await formulaInput.clear();
      await formulaInput.fill(currentFormula + ' * 1.1');

      // Guardar clon
      await page.getByRole('button', { name: /guardar/i }).click();

      // Verificar creación
      await expect(page.getByText(/fórmula clonada exitosamente/i)).toBeVisible();
      await expect(page.getByText(currentName + ' - Copia')).toBeVisible();
    }
  });

  test('Buscar y filtrar fórmulas', async ({ page }) => {
    // Buscar por nombre
    await page.getByPlaceholder(/buscar/i).fill('Express');
    await page.waitForTimeout(500);

    // Verificar filtrado
    const formulaCards = page.locator('.formula-card, [data-testid="formula-item"]');
    const count = await formulaCards.count();

    if (count > 0) {
      // Verificar que todas contienen "Express"
      for (let i = 0; i < count; i++) {
        const card = formulaCards.nth(i);
        await expect(card).toContainText(/express/i);
      }
    }

    // Filtrar por cliente
    const clientFilter = page.getByLabel(/filtrar.*cliente/i);
    if (await clientFilter.isVisible()) {
      await clientFilter.click();
      await page.getByRole('option').first().click();
      await page.waitForTimeout(500);
    }

    // Filtrar por estado
    const statusFilter = page.getByLabel(/estado/i);
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Activa');
      await page.waitForTimeout(500);
    }

    // Limpiar filtros
    const clearButton = page.getByRole('button', { name: /limpiar filtros/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('Desactivar y activar fórmulas', async ({ page }) => {
    // Buscar fórmula activa
    const toggleButton = page.getByRole('button', { name: /desactivar/i }).first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();

      // Confirmar desactivación
      await expect(page.getByText(/confirmar.*desactivación/i)).toBeVisible();
      await page.getByRole('button', { name: /confirmar/i }).click();

      // Verificar estado cambiado
      await expect(page.getByText(/fórmula desactivada/i)).toBeVisible();

      // Ahora debería poder reactivar
      const activateButton = page.getByRole('button', { name: /activar/i }).first();
      await expect(activateButton).toBeVisible();

      await activateButton.click();
      await expect(page.getByText(/fórmula activada/i)).toBeVisible();
    }
  });
});
