import { test, expect } from '@playwright/test';

test.describe('Complete Viaje Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create complete viaje workflow: cliente → site → tramo → viaje', async ({ page }) => {
    // 1. Crear Cliente
    await page.getByRole('link', { name: /clientes/i }).click();
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    await page.getByLabel(/código/i).fill('WORKFLOW001');
    await page.getByLabel(/nombre/i).fill('Cliente Workflow Test');
    await page.getByLabel(/cuit/i).fill('20-12345678-9');
    await page.getByLabel(/email/i).fill('workflow@test.com');

    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/cliente creado exitosamente/i)).toBeVisible();

    // 2. Crear Sites (Origen y Destino)
    await page.getByRole('link', { name: /sites/i }).click();

    // Site Origen
    await page.getByRole('button', { name: /nuevo site/i }).click();
    
    await page.getByLabel(/cliente/i).click();
    await page.getByText('Cliente Workflow Test').click();
    
    await page.getByLabel(/denominación/i).fill('Depósito Central');
    await page.getByLabel(/dirección/i).fill('Av. Corrientes 1000');
    await page.getByLabel(/ciudad/i).fill('Buenos Aires');
    await page.getByLabel(/provincia/i).click();
    await page.getByText('Buenos Aires').click();

    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/site creado exitosamente/i)).toBeVisible();

    // Site Destino
    await page.getByRole('button', { name: /nuevo site/i }).click();
    
    await page.getByLabel(/cliente/i).click();
    await page.getByText('Cliente Workflow Test').click();
    
    await page.getByLabel(/denominación/i).fill('Sucursal Norte');
    await page.getByLabel(/dirección/i).fill('Av. Cabildo 2000');
    await page.getByLabel(/ciudad/i).fill('Buenos Aires');
    await page.getByLabel(/provincia/i).click();
    await page.getByText('Buenos Aires').click();

    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/site creado exitosamente/i)).toBeVisible();

    // 3. Crear Tramo
    await page.getByRole('link', { name: /tramos/i }).click();
    await page.getByRole('button', { name: /nuevo tramo/i }).click();

    await page.getByLabel(/cliente/i).click();
    await page.getByText('Cliente Workflow Test').click();

    await page.getByLabel(/denominación/i).fill('Central → Norte');

    // Esperar a que se carguen los sites
    await page.waitForTimeout(1000);

    await page.getByLabel(/origen/i).click();
    await page.getByText('Depósito Central').click();

    await page.getByLabel(/destino/i).click();
    await page.getByText('Sucursal Norte').click();

    // Crear tarifa
    await page.getByText(/tarifas/i).click();
    await page.getByRole('button', { name: /agregar tarifa/i }).click();

    await page.getByLabel(/vigencia desde/i).fill('2023-01-01');
    await page.getByLabel(/vigencia hasta/i).fill('2023-12-31');
    await page.getByLabel(/tipo de cálculo/i).click();
    await page.getByText('Por Viaje').click();
    await page.getByLabel(/importe/i).fill('75000');

    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/tramo creado exitosamente/i)).toBeVisible();

    // 4. Crear Viaje
    await page.getByRole('link', { name: /viajes/i }).click();
    await page.getByRole('button', { name: /nuevo viaje/i }).click();

    await page.getByLabel(/cliente/i).click();
    await page.getByText('Cliente Workflow Test').click();

    // Esperar a que se carguen los tramos
    await page.waitForTimeout(1000);

    await page.getByLabel(/tramo/i).click();
    await page.getByText('Central → Norte').click();

    // Ingresar fecha (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.getByLabel(/fecha/i).fill(dateString);

    // Verificar que se muestra el calculador de tarifa
    await expect(page.getByText(/calculadora de tarifas/i)).toBeVisible();
    await expect(page.getByText(/75\.000/)).toBeVisible();

    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/viaje creado exitosamente/i)).toBeVisible();

    // 5. Verificar el viaje en la lista
    await expect(page.getByText('Cliente Workflow Test')).toBeVisible();
    await expect(page.getByText('Central → Norte')).toBeVisible();
    await expect(page.getByText('PENDIENTE')).toBeVisible();
  });

  test('should calculate different tariff types correctly', async ({ page }) => {
    // Navegar a viajes
    await page.getByRole('link', { name: /viajes/i }).click();
    await page.getByRole('button', { name: /nuevo viaje/i }).click();

    // Seleccionar cliente y tramo (asumiendo que ya existen)
    await page.getByLabel(/cliente/i).click();
    await page.getByText('Cliente Workflow Test').first().click();

    await page.waitForTimeout(1000);

    await page.getByLabel(/tramo/i).click();
    await page.getByText('Central → Norte').first().click();

    // Verificar cálculo POR_VIAJE
    await expect(page.getByText(/tipo de cálculo: por viaje/i)).toBeVisible();
    
    // Cambiar cantidad de camiones
    await page.getByLabel(/cantidad de camiones/i).clear();
    await page.getByLabel(/cantidad de camiones/i).fill('2');

    // Verificar que se recalcula el total (75000 * 2 = 150000)
    await expect(page.getByText(/150\.000/)).toBeVisible();

    // Probar con peso para verificar cálculo POR_TONELADA
    await page.getByLabel(/peso total/i).fill('25000'); // 25 toneladas
    
    // Si el tramo tuviera tarifa POR_TONELADA, se calcularía diferente
    // Este test asume que tenemos diferentes tipos de tramos configurados
  });

  test('should handle viaje state transitions', async ({ page }) => {
    // Ir a lista de viajes
    await page.getByRole('link', { name: /viajes/i }).click();

    // Buscar el viaje creado
    await page.getByPlaceholder(/buscar/i).fill('Workflow Test');
    await page.waitForTimeout(500);

    // Cambiar estado a EN_PROGRESO
    await page.getByRole('button', { name: /cambiar estado/i }).first().click();
    await page.getByText('En Progreso').click();

    await expect(page.getByText(/estado actualizado/i)).toBeVisible();
    await expect(page.getByText('EN_PROGRESO')).toBeVisible();

    // Cambiar estado a COMPLETADO
    await page.getByRole('button', { name: /cambiar estado/i }).first().click();
    await page.getByText('Completado').click();

    await expect(page.getByText(/estado actualizado/i)).toBeVisible();
    await expect(page.getByText('COMPLETADO')).toBeVisible();
  });

  test('should generate and view reports', async ({ page }) => {
    // Ir a reportes
    await page.getByRole('link', { name: /reportes/i }).click();

    // Crear reporte de viajes
    await page.getByRole('button', { name: /nuevo reporte/i }).click();

    await page.getByLabel(/nombre del reporte/i).fill('Reporte Viajes Workflow');
    await page.getByLabel(/fuente de datos/i).click();
    await page.getByText('Viajes').click();

    // Agregar filtros
    await page.getByRole('button', { name: /agregar filtro/i }).click();
    await page.getByLabel(/campo/i).click();
    await page.getByText('Cliente').click();
    await page.getByLabel(/operador/i).click();
    await page.getByText('Contiene').click();
    await page.getByLabel(/valor/i).fill('Workflow');

    // Generar reporte
    await page.getByRole('button', { name: /generar reporte/i }).click();

    // Verificar que se muestra el reporte
    await expect(page.getByText(/reporte generado exitosamente/i)).toBeVisible();
    await expect(page.getByText('Cliente Workflow Test')).toBeVisible();

    // Exportar a Excel
    await page.getByRole('button', { name: /exportar/i }).click();
    await page.getByText('Excel').click();

    // Verificar descarga (esto podría requerir configuración adicional)
    await expect(page.getByText(/exportación iniciada/i)).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Simular error de red desconectando
    await page.route('**/api/**', route => route.abort());

    // Intentar crear un viaje
    await page.getByRole('link', { name: /viajes/i }).click();
    await page.getByRole('button', { name: /nuevo viaje/i }).click();

    // Debería mostrar error al cargar clientes
    await expect(page.getByText(/error al cargar/i)).toBeVisible();

    // Restaurar conexión
    await page.unroute('**/api/**');

    // Recargar página
    await page.reload();

    // Debería funcionar normalmente
    await expect(page.getByRole('button', { name: /nuevo viaje/i })).toBeVisible();
  });
});