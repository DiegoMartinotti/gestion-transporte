import { test, expect } from '@playwright/test';

test.describe('BaseService Integration - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Clientes with BaseService', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('link', { name: /clientes/i }).click();
      await expect(page).toHaveURL('/clientes');
    });

    test('should handle pagination correctly', async ({ page }) => {
      // Primero crear varios clientes para probar paginación
      const clientes = Array.from({ length: 15 }, (_, i) => ({
        nombre: `Cliente BaseService ${i + 1}`,
        cuit: `20-1234567${i.toString().padStart(2, '0')}-${i % 10}`
      }));

      for (const cliente of clientes) {
        await page.getByRole('button', { name: /nuevo cliente/i }).click();
        await page.getByLabel(/nombre/i).fill(cliente.nombre);
        await page.getByLabel(/cuit/i).fill(cliente.cuit);
        await page.getByRole('button', { name: /guardar/i }).click();
        await expect(page.getByText(/cliente creado exitosamente/i)).toBeVisible();
        await page.waitForTimeout(500);
      }

      // Verificar que aparece paginación
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
      
      // Verificar información de paginación
      await expect(page.getByText(/página 1 de/)).toBeVisible();
      await expect(page.getByText(/total.*elementos/)).toBeVisible();

      // Navegar a página 2
      await page.getByRole('button', { name: /página siguiente/i }).click();
      await expect(page.getByText(/página 2 de/)).toBeVisible();

      // Verificar que se cargan diferentes elementos
      await expect(page.getByText('Cliente BaseService 11')).toBeVisible();
    });

    test('should filter with BaseService efficiently', async ({ page }) => {
      // Crear algunos clientes con nombres distintos
      const clientesTest = [
        { nombre: 'Empresa Alpha Solutions', cuit: '20-11111111-1' },
        { nombre: 'Beta Corporación', cuit: '20-22222222-2' },
        { nombre: 'Gamma Industries', cuit: '20-33333333-3' }
      ];

      for (const cliente of clientesTest) {
        await page.getByRole('button', { name: /nuevo cliente/i }).click();
        await page.getByLabel(/nombre/i).fill(cliente.nombre);
        await page.getByLabel(/cuit/i).fill(cliente.cuit);
        await page.getByRole('button', { name: /guardar/i }).click();
        await expect(page.getByText(/cliente creado exitosamente/i)).toBeVisible();
        await page.waitForTimeout(500);
      }

      // Filtrar por "Alpha"
      await page.getByPlaceholder(/buscar/i).fill('Alpha');
      await page.waitForTimeout(1000); // Esperar respuesta del BaseService
      
      await expect(page.getByText('Empresa Alpha Solutions')).toBeVisible();
      await expect(page.getByText('Beta Corporación')).not.toBeVisible();
      await expect(page.getByText('Gamma Industries')).not.toBeVisible();

      // Limpiar filtro
      await page.getByPlaceholder(/buscar/i).clear();
      await page.waitForTimeout(1000);
      
      // Verificar que aparecen todos
      await expect(page.getByText('Empresa Alpha Solutions')).toBeVisible();
      await expect(page.getByText('Beta Corporación')).toBeVisible();
      await expect(page.getByText('Gamma Industries')).toBeVisible();
    });
  });

  test.describe('Vehículos with BaseService', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('link', { name: /vehículos/i }).click();
      await expect(page).toHaveURL('/vehiculos');
    });

    test('should create and manage vehiculo with BaseService', async ({ page }) => {
      // Crear nuevo vehículo
      await page.getByRole('button', { name: /nuevo vehículo/i }).click();

      const testVehiculo = {
        patente: 'BS123',
        marca: 'Mercedes-Benz',
        modelo: 'Actros',
        año: '2023',
        capacidadCarga: '15000'
      };

      await page.getByLabel(/patente/i).fill(testVehiculo.patente);
      await page.getByLabel(/marca/i).fill(testVehiculo.marca);
      await page.getByLabel(/modelo/i).fill(testVehiculo.modelo);
      await page.getByLabel(/año/i).fill(testVehiculo.año);
      await page.getByLabel(/capacidad.*carga/i).fill(testVehiculo.capacidadCarga);

      // Seleccionar tipo de vehículo
      await page.getByLabel(/tipo.*vehículo/i).click();
      await page.getByText(/camión/i).click();

      // Guardar
      await page.getByRole('button', { name: /guardar/i }).click();
      await expect(page.getByText(/vehículo creado exitosamente/i)).toBeVisible();

      // Verificar en la lista
      await expect(page.getByText(testVehiculo.patente)).toBeVisible();
      await expect(page.getByText(testVehiculo.marca)).toBeVisible();

      // Actualizar vehículo
      await page.getByPlaceholder(/buscar/i).fill(testVehiculo.patente);
      await page.waitForTimeout(500);
      
      await page.getByRole('button', { name: /editar/i }).first().click();
      
      const nuevoModelo = 'Actros 2024';
      await page.getByLabel(/modelo/i).clear();
      await page.getByLabel(/modelo/i).fill(nuevoModelo);
      
      await page.getByRole('button', { name: /guardar/i }).click();
      await expect(page.getByText(/vehículo actualizado exitosamente/i)).toBeVisible();

      // Verificar actualización
      await expect(page.getByText(nuevoModelo)).toBeVisible();
    });
  });

  test.describe('Sites with BaseService', () => {
    test.beforeEach(async ({ page }) => {
      // Primero crear un cliente para asociar sites
      await page.getByRole('link', { name: /clientes/i }).click();
      await page.getByRole('button', { name: /nuevo cliente/i }).click();
      await page.getByLabel(/nombre/i).fill('Cliente para Sites Test');
      await page.getByLabel(/cuit/i).fill('20-99999999-9');
      await page.getByRole('button', { name: /guardar/i }).click();
      await expect(page.getByText(/cliente creado exitosamente/i)).toBeVisible();
      
      // Navegar a sites
      await page.getByRole('link', { name: /sites/i }).click();
      await expect(page).toHaveURL('/sites');
    });

    test('should create site linked to cliente using BaseService', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo site/i }).click();

      const testSite = {
        nombre: 'Depósito Central BaseService',
        direccion: 'Av. BaseService 123',
        ciudad: 'Buenos Aires'
      };

      await page.getByLabel(/nombre/i).fill(testSite.nombre);
      await page.getByLabel(/dirección/i).fill(`${testSite.direccion}, ${testSite.ciudad}`);
      
      // Seleccionar cliente
      await page.getByLabel(/cliente/i).click();
      await page.getByText('Cliente para Sites Test').click();

      await page.getByRole('button', { name: /guardar/i }).click();
      await expect(page.getByText(/site creado exitosamente/i)).toBeVisible();

      // Verificar en la lista
      await expect(page.getByText(testSite.nombre)).toBeVisible();
      await expect(page.getByText('Cliente para Sites Test')).toBeVisible();

      // Verificar filtro por cliente
      await page.getByLabel(/filtrar.*cliente/i).click();
      await page.getByText('Cliente para Sites Test').click();
      
      await expect(page.getByText(testSite.nombre)).toBeVisible();
    });
  });

  test.describe('Cross-Entity Integration Flow', () => {
    test('should complete full workflow: Cliente → Site → Vehículo', async ({ page }) => {
      // 1. Crear Cliente
      await page.getByRole('link', { name: /clientes/i }).click();
      await page.getByRole('button', { name: /nuevo cliente/i }).click();
      
      const cliente = {
        nombre: 'Empresa Workflow BaseService',
        cuit: '20-88888888-8'
      };
      
      await page.getByLabel(/nombre/i).fill(cliente.nombre);
      await page.getByLabel(/cuit/i).fill(cliente.cuit);
      await page.getByRole('button', { name: /guardar/i }).click();
      await expect(page.getByText(/cliente creado exitosamente/i)).toBeVisible();

      // 2. Crear Sites para el cliente
      await page.getByRole('link', { name: /sites/i }).click();
      
      const sites = [
        { nombre: 'Origen Workflow', direccion: 'Av. Origen 100' },
        { nombre: 'Destino Workflow', direccion: 'Av. Destino 200' }
      ];

      for (const site of sites) {
        await page.getByRole('button', { name: /nuevo site/i }).click();
        await page.getByLabel(/nombre/i).fill(site.nombre);
        await page.getByLabel(/dirección/i).fill(site.direccion);
        
        await page.getByLabel(/cliente/i).click();
        await page.getByText(cliente.nombre).click();
        
        await page.getByRole('button', { name: /guardar/i }).click();
        await expect(page.getByText(/site creado exitosamente/i)).toBeVisible();
        await page.waitForTimeout(500);
      }

      // 3. Crear Vehículo
      await page.getByRole('link', { name: /vehículos/i }).click();
      await page.getByRole('button', { name: /nuevo vehículo/i }).click();
      
      const vehiculo = {
        patente: 'WF123',
        marca: 'Scania',
        modelo: 'G450'
      };
      
      await page.getByLabel(/patente/i).fill(vehiculo.patente);
      await page.getByLabel(/marca/i).fill(vehiculo.marca);
      await page.getByLabel(/modelo/i).fill(vehiculo.modelo);
      await page.getByLabel(/año/i).fill('2023');
      await page.getByLabel(/capacidad.*carga/i).fill('20000');
      
      await page.getByLabel(/tipo.*vehículo/i).click();
      await page.getByText(/camión/i).click();
      
      await page.getByRole('button', { name: /guardar/i }).click();
      await expect(page.getByText(/vehículo creado exitosamente/i)).toBeVisible();

      // 4. Verificar que todas las entidades están relacionadas correctamente
      // Verificar cliente existe
      await page.getByRole('link', { name: /clientes/i }).click();
      await page.getByPlaceholder(/buscar/i).fill(cliente.nombre);
      await page.waitForTimeout(500);
      await expect(page.getByText(cliente.nombre)).toBeVisible();

      // Verificar sites del cliente
      await page.getByRole('link', { name: /sites/i }).click();
      await page.getByLabel(/filtrar.*cliente/i).click();
      await page.getByText(cliente.nombre).click();
      
      await expect(page.getByText('Origen Workflow')).toBeVisible();
      await expect(page.getByText('Destino Workflow')).toBeVisible();

      // Verificar vehículo
      await page.getByRole('link', { name: /vehículos/i }).click();
      await page.getByPlaceholder(/buscar/i).fill(vehiculo.patente);
      await page.waitForTimeout(500);
      await expect(page.getByText(vehiculo.patente)).toBeVisible();
    });
  });

  test.describe('BaseService Performance', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      await page.getByRole('link', { name: /clientes/i }).click();

      // Medir tiempo de creación de múltiples registros
      const startTime = Date.now();
      
      // Crear 10 clientes rápidamente
      for (let i = 1; i <= 10; i++) {
        await page.getByRole('button', { name: /nuevo cliente/i }).click();
        await page.getByLabel(/nombre/i).fill(`Cliente Performance ${i}`);
        await page.getByLabel(/cuit/i).fill(`20-1111111${i}-${i}`);
        await page.getByRole('button', { name: /guardar/i }).click();
        await expect(page.getByText(/cliente creado exitosamente/i)).toBeVisible();
        await page.waitForTimeout(200); // Pequeña pausa entre creaciones
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // El tiempo debería ser razonable (menos de 30 segundos)
      expect(duration).toBeLessThan(30000);

      // Verificar que la paginación maneja bien los datos
      await expect(page.getByText(/página.*de/)).toBeVisible();
      
      // Verificar que el filtro funciona con muchos datos
      await page.getByPlaceholder(/buscar/i).fill('Performance 5');
      await page.waitForTimeout(1000);
      
      await expect(page.getByText('Cliente Performance 5')).toBeVisible();
      // Solo debería mostrar un resultado
      await expect(page.getByText('Cliente Performance 1')).not.toBeVisible();
      await expect(page.getByText('Cliente Performance 10')).not.toBeVisible();
    });
  });

  test.describe('Error Handling with BaseService', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.getByRole('link', { name: /clientes/i }).click();

      // Simular desconexión de red durante una operación
      await page.context().setOffline(true);
      
      await page.getByRole('button', { name: /nuevo cliente/i }).click();
      await page.getByLabel(/nombre/i).fill('Cliente Sin Red');
      await page.getByLabel(/cuit/i).fill('20-00000000-0');
      await page.getByRole('button', { name: /guardar/i }).click();

      // Debería mostrar error de red
      await expect(page.getByText(/error.*conexión/i)).toBeVisible();

      // Restaurar conexión
      await page.context().setOffline(false);
      
      // Intentar de nuevo
      await page.getByRole('button', { name: /guardar/i }).click();
      await expect(page.getByText(/cliente creado exitosamente/i)).toBeVisible();
    });

    test('should show proper validation errors from BaseService', async ({ page }) => {
      await page.getByRole('link', { name: /clientes/i }).click();
      await page.getByRole('button', { name: /nuevo cliente/i }).click();

      // Intentar crear cliente con CUIT duplicado
      await page.getByLabel(/nombre/i).fill('Cliente Duplicado');
      await page.getByLabel(/cuit/i).fill('20-88888888-8'); // CUIT ya usado en test anterior
      await page.getByRole('button', { name: /guardar/i }).click();

      // Debería mostrar error de duplicación
      await expect(page.getByText(/ya existe.*cuit/i)).toBeVisible();
    });
  });
});