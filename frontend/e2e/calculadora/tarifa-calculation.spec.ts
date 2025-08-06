import { test, expect } from '@playwright/test';

test.describe('Calculadora de Tarifas - Cálculos y Validaciones', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Navegar a calculadora
    await page.goto('/calculadora');
    await expect(page).toHaveURL('/calculadora');
  });

  test('Calcular tarifa por viaje simple', async ({ page }) => {
    // Seleccionar cliente
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();

    // Seleccionar tramo
    await page.getByLabel(/tramo/i).click();
    await page.getByRole('option').first().click();

    // Ingresar fecha
    const fecha = new Date();
    await page.getByLabel(/fecha/i).fill(fecha.toISOString().split('T')[0]);

    // Cantidad de camiones
    await page.getByLabel(/cantidad.*camiones/i).fill('1');

    // Calcular
    await page.getByRole('button', { name: /calcular/i }).click();

    // Verificar resultado
    await expect(page.getByText(/resultado/i)).toBeVisible();
    await expect(page.getByText(/\$.*\d+/)).toBeVisible(); // Formato de moneda

    // Verificar desglose
    const desglose = page.getByText(/desglose/i);
    if (await desglose.isVisible()) {
      await expect(page.getByText(/tarifa base/i)).toBeVisible();
      await expect(page.getByText(/total/i)).toBeVisible();
    }
  });

  test('Calcular tarifa por tonelada', async ({ page }) => {
    // Seleccionar tipo de cálculo
    const tipoCalculo = page.getByLabel(/tipo.*cálculo/i);
    if (await tipoCalculo.isVisible()) {
      await tipoCalculo.selectOption('POR_TONELADA');
    }

    // Seleccionar cliente y tramo
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();

    await page.getByLabel(/tramo/i).click();
    await page.getByRole('option').first().click();

    // Ingresar peso
    await page.getByLabel(/peso.*toneladas/i).fill('25.5');

    // Fecha
    const fecha = new Date();
    await page.getByLabel(/fecha/i).fill(fecha.toISOString().split('T')[0]);

    // Calcular
    await page.getByRole('button', { name: /calcular/i }).click();

    // Verificar cálculo por tonelada
    await expect(page.getByText(/25.*5.*toneladas/i)).toBeVisible();
    await expect(page.getByText(/precio.*tonelada/i)).toBeVisible();
    await expect(page.getByText(/\$.*\d+/)).toBeVisible();
  });

  test('Calcular tarifa por kilómetro', async ({ page }) => {
    // Seleccionar tipo de cálculo
    const tipoCalculo = page.getByLabel(/tipo.*cálculo/i);
    if (await tipoCalculo.isVisible()) {
      await tipoCalculo.selectOption('POR_KILOMETRO');
    }

    // Seleccionar cliente y tramo
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();

    await page.getByLabel(/tramo/i).click();
    await page.getByRole('option').first().click();

    // Distancia (puede calcularse automáticamente o ingresarse)
    const distanciaInput = page.getByLabel(/distancia.*km/i);
    if (await distanciaInput.isVisible()) {
      await distanciaInput.fill('150');
    }

    // Fecha
    const fecha = new Date();
    await page.getByLabel(/fecha/i).fill(fecha.toISOString().split('T')[0]);

    // Calcular
    await page.getByRole('button', { name: /calcular/i }).click();

    // Verificar cálculo por kilómetro
    await expect(page.getByText(/150.*km/i)).toBeVisible();
    await expect(page.getByText(/precio.*km/i)).toBeVisible();
  });

  test('Aplicar extras y modificadores', async ({ page }) => {
    // Configurar cálculo básico
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();

    await page.getByLabel(/tramo/i).click();
    await page.getByRole('option').first().click();

    // Agregar extras
    const extrasButton = page.getByRole('button', { name: /agregar extra/i });
    if (await extrasButton.isVisible()) {
      await extrasButton.click();

      // Seleccionar extra
      await page.getByLabel(/tipo.*extra/i).click();
      await page.getByRole('option', { name: /peaje/i }).click();

      await page.getByLabel(/monto.*extra/i).fill('500');

      // Agregar otro extra
      await page.getByRole('button', { name: /agregar.*otro/i }).click();
      await page
        .getByLabel(/tipo.*extra/i)
        .last()
        .click();
      await page.getByRole('option', { name: /espera/i }).click();
      await page
        .getByLabel(/monto.*extra/i)
        .last()
        .fill('1000');
    }

    // Aplicar descuento
    const descuentoInput = page.getByLabel(/descuento/i);
    if (await descuentoInput.isVisible()) {
      await descuentoInput.fill('10'); // 10%
    }

    // Calcular
    await page.getByRole('button', { name: /calcular/i }).click();

    // Verificar que se aplicaron extras y descuentos
    await expect(page.getByText(/extras/i)).toBeVisible();
    await expect(page.getByText(/peaje.*500/i)).toBeVisible();
    await expect(page.getByText(/espera.*1000/i)).toBeVisible();
    await expect(page.getByText(/descuento.*10%/i)).toBeVisible();

    // Verificar total final
    await expect(page.getByText(/total final/i)).toBeVisible();
  });

  test('Comparar tarifas entre períodos', async ({ page }) => {
    // Buscar opción de comparación
    const compareButton = page.getByRole('button', { name: /comparar tarifas/i });
    if (await compareButton.isVisible()) {
      await compareButton.click();

      // Seleccionar cliente y tramo
      await page.getByLabel(/cliente/i).click();
      await page.getByRole('option').first().click();

      await page.getByLabel(/tramo/i).click();
      await page.getByRole('option').first().click();

      // Período 1
      await page
        .getByLabel(/fecha.*desde/i)
        .first()
        .fill('2024-01-01');
      await page
        .getByLabel(/fecha.*hasta/i)
        .first()
        .fill('2024-06-30');

      // Período 2
      await page
        .getByLabel(/fecha.*desde/i)
        .last()
        .fill('2024-07-01');
      await page
        .getByLabel(/fecha.*hasta/i)
        .last()
        .fill('2024-12-31');

      // Comparar
      await page.getByRole('button', { name: /comparar/i }).click();

      // Verificar resultados de comparación
      await expect(page.getByText(/comparación.*tarifas/i)).toBeVisible();
      await expect(page.getByText(/período 1/i)).toBeVisible();
      await expect(page.getByText(/período 2/i)).toBeVisible();
      await expect(page.getByText(/diferencia/i)).toBeVisible();

      // Verificar gráfico si existe
      const chart = page.locator('canvas, svg.chart');
      if ((await chart.count()) > 0) {
        await expect(chart.first()).toBeVisible();
      }
    }
  });

  test('Simular múltiples escenarios', async ({ page }) => {
    // Buscar simulador
    const simulatorButton = page.getByRole('button', { name: /simulador/i });
    if (await simulatorButton.isVisible()) {
      await simulatorButton.click();

      // Configurar escenario base
      await page.getByLabel(/cliente/i).click();
      await page.getByRole('option').first().click();

      await page.getByLabel(/tramo/i).click();
      await page.getByRole('option').first().click();

      // Agregar múltiples escenarios
      const scenarios = [
        { camiones: 1, peso: 10, descuento: 0 },
        { camiones: 2, peso: 20, descuento: 5 },
        { camiones: 3, peso: 30, descuento: 10 },
      ];

      for (const scenario of scenarios) {
        await page.getByRole('button', { name: /agregar escenario/i }).click();

        const lastScenario = page.locator('.scenario-card').last();
        await lastScenario.getByLabel(/camiones/i).fill(scenario.camiones.toString());
        await lastScenario.getByLabel(/peso/i).fill(scenario.peso.toString());
        await lastScenario.getByLabel(/descuento/i).fill(scenario.descuento.toString());
      }

      // Simular todos
      await page.getByRole('button', { name: /simular todos/i }).click();

      // Verificar tabla comparativa
      await expect(page.getByText(/comparación.*escenarios/i)).toBeVisible();
      const resultsTable = page.locator('table').filter({ hasText: /escenario.*total/i });
      await expect(resultsTable).toBeVisible();

      // Verificar que muestra el mejor escenario
      await expect(page.getByText(/mejor.*escenario/i)).toBeVisible();
    }
  });

  test('Exportar cálculos a Excel', async ({ page }) => {
    // Realizar un cálculo
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();

    await page.getByLabel(/tramo/i).click();
    await page.getByRole('option').first().click();

    await page.getByRole('button', { name: /calcular/i }).click();

    // Exportar resultado
    const exportButton = page.getByRole('button', { name: /exportar/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Seleccionar formato
      await page.getByText(/excel/i).click();

      // Verificar descarga
      await expect(page.getByText(/exportación.*iniciada/i)).toBeVisible();
    }

    // Verificar opción de imprimir
    const printButton = page.getByRole('button', { name: /imprimir/i });
    if (await printButton.isVisible()) {
      // No ejecutar realmente la impresión, solo verificar que existe
      await expect(printButton).toBeVisible();
    }
  });

  test('Historial de cálculos', async ({ page }) => {
    // Realizar varios cálculos
    for (let i = 0; i < 3; i++) {
      await page.getByLabel(/cliente/i).click();
      await page.getByRole('option').first().click();

      await page.getByLabel(/tramo/i).click();
      await page.getByRole('option').nth(i).click();

      await page.getByRole('button', { name: /calcular/i }).click();
      await page.waitForTimeout(500);

      // Limpiar para siguiente cálculo
      const clearButton = page.getByRole('button', { name: /limpiar|nuevo/i });
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }
    }

    // Ver historial
    const historyButton = page.getByRole('button', { name: /historial/i });
    if (await historyButton.isVisible()) {
      await historyButton.click();

      // Verificar que muestra los cálculos anteriores
      await expect(page.getByText(/historial.*cálculos/i)).toBeVisible();

      const historyItems = page.locator('.history-item, [data-testid="history-item"]');
      expect(await historyItems.count()).toBeGreaterThan(0);

      // Recuperar un cálculo anterior
      const recoverButton = historyItems.first().getByRole('button', { name: /recuperar|cargar/i });
      if (await recoverButton.isVisible()) {
        await recoverButton.click();

        // Verificar que se cargan los datos
        await expect(page.getByLabel(/cliente/i)).not.toBeEmpty();
        await expect(page.getByLabel(/tramo/i)).not.toBeEmpty();
      }
    }
  });

  test('Validaciones de datos incorrectos', async ({ page }) => {
    // Intentar calcular sin datos
    await page.getByRole('button', { name: /calcular/i }).click();

    // Verificar errores
    await expect(page.getByText(/cliente.*requerido/i)).toBeVisible();
    await expect(page.getByText(/tramo.*requerido/i)).toBeVisible();

    // Ingresar datos inválidos
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();

    await page.getByLabel(/tramo/i).click();
    await page.getByRole('option').first().click();

    // Peso negativo
    const pesoInput = page.getByLabel(/peso/i);
    if (await pesoInput.isVisible()) {
      await pesoInput.fill('-10');
      await page.getByRole('button', { name: /calcular/i }).click();
      await expect(page.getByText(/peso.*válido/i)).toBeVisible();
    }

    // Fecha fuera de vigencia
    await page.getByLabel(/fecha/i).fill('2020-01-01');
    await page.getByRole('button', { name: /calcular/i }).click();
    await expect(page.getByText(/fecha.*vigencia|tarifa.*vigente/i)).toBeVisible();
  });

  test('Calculadora rápida sin login previo', async ({ page }) => {
    // Verificar si existe calculadora pública
    await page.goto('/calculadora-publica');

    if (page.url().includes('calculadora-publica')) {
      // Debería mostrar calculadora simplificada
      await expect(page.getByText(/calculadora.*tarifas/i)).toBeVisible();

      // Funcionalidad limitada
      await expect(page.getByText(/ingrese.*datos.*estimación/i)).toBeVisible();

      // Campos básicos
      await expect(page.getByLabel(/origen/i)).toBeVisible();
      await expect(page.getByLabel(/destino/i)).toBeVisible();
      await expect(page.getByLabel(/peso/i)).toBeVisible();

      // Calcular estimación
      await page.getByRole('button', { name: /calcular.*estimación/i }).click();

      // Mostrar resultado aproximado
      await expect(page.getByText(/estimación|aproximado/i)).toBeVisible();
    }
  });
});
