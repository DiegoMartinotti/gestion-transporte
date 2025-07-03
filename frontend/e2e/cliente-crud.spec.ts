import { test, expect } from '@playwright/test';

test.describe('Cliente CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Navegar a clientes
    await page.getByRole('link', { name: /clientes/i }).click();
    await expect(page).toHaveURL('/clientes');
  });

  test('should create new cliente successfully', async ({ page }) => {
    // Click en "Nuevo Cliente"
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // Llenar formulario
    await page.getByLabel(/código/i).fill('CLI999');
    await page.getByLabel(/nombre/i).fill('Cliente E2E Test');
    await page.getByLabel(/cuit/i).fill('20-12345678-9');
    await page.getByLabel(/email/i).fill('cliente@e2etest.com');
    await page.getByLabel(/teléfono/i).fill('1234567890');

    // Completar dirección
    await page.getByLabel(/calle/i).fill('Av. Test');
    await page.getByLabel(/número/i).fill('123');
    await page.getByLabel(/ciudad/i).fill('Buenos Aires');
    await page.getByLabel(/provincia/i).fill('Buenos Aires');
    await page.getByLabel(/código postal/i).fill('1000');

    // Guardar
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar notificación de éxito
    await expect(page.getByText(/cliente creado exitosamente/i)).toBeVisible();

    // Verificar que aparece en la lista
    await expect(page.getByText('Cliente E2E Test')).toBeVisible();
    await expect(page.getByText('CLI999')).toBeVisible();
  });

  test('should edit existing cliente', async ({ page }) => {
    // Buscar cliente existente
    await page.getByPlaceholder(/buscar/i).fill('Cliente E2E Test');
    
    // Esperar a que se filtren los resultados
    await page.waitForTimeout(500);

    // Click en editar (icono de lápiz)
    await page.getByRole('button', { name: /editar/i }).first().click();

    // Modificar nombre
    const nombreInput = page.getByLabel(/nombre/i);
    await nombreInput.clear();
    await nombreInput.fill('Cliente E2E Test Editado');

    // Guardar cambios
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar notificación de éxito
    await expect(page.getByText(/cliente actualizado exitosamente/i)).toBeVisible();

    // Verificar que se actualiza en la lista
    await expect(page.getByText('Cliente E2E Test Editado')).toBeVisible();
  });

  test('should view cliente details', async ({ page }) => {
    // Buscar cliente
    await page.getByPlaceholder(/buscar/i).fill('Cliente E2E Test');
    await page.waitForTimeout(500);

    // Click en ver detalles (icono de ojo)
    await page.getByRole('button', { name: /ver detalles/i }).first().click();

    // Verificar que se muestra el modal de detalles
    await expect(page.getByText(/detalles del cliente/i)).toBeVisible();
    await expect(page.getByText('Cliente E2E Test')).toBeVisible();
    await expect(page.getByText('CLI999')).toBeVisible();
    await expect(page.getByText('20-12345678-9')).toBeVisible();

    // Cerrar modal
    await page.getByRole('button', { name: /cerrar/i }).click();
  });

  test('should filter clientes by search', async ({ page }) => {
    // Crear varios clientes para probar filtros
    const clientes = [
      { codigo: 'TEST001', nombre: 'Empresa Alpha' },
      { codigo: 'TEST002', nombre: 'Empresa Beta' },
      { codigo: 'TEST003', nombre: 'Compañía Gamma' }
    ];

    for (const cliente of clientes) {
      await page.getByRole('button', { name: /nuevo cliente/i }).click();
      await page.getByLabel(/código/i).fill(cliente.codigo);
      await page.getByLabel(/nombre/i).fill(cliente.nombre);
      await page.getByLabel(/cuit/i).fill('20-12345678-9');
      await page.getByRole('button', { name: /guardar/i }).click();
      await expect(page.getByText(/cliente creado exitosamente/i)).toBeVisible();
      await page.waitForTimeout(1000); // Esperar a que se cierre el modal
    }

    // Probar búsqueda por nombre
    await page.getByPlaceholder(/buscar/i).fill('Alpha');
    await page.waitForTimeout(500);
    
    await expect(page.getByText('Empresa Alpha')).toBeVisible();
    await expect(page.getByText('Empresa Beta')).not.toBeVisible();

    // Probar búsqueda por código
    await page.getByPlaceholder(/buscar/i).clear();
    await page.getByPlaceholder(/buscar/i).fill('TEST002');
    await page.waitForTimeout(500);
    
    await expect(page.getByText('Empresa Beta')).toBeVisible();
    await expect(page.getByText('Empresa Alpha')).not.toBeVisible();

    // Limpiar búsqueda
    await page.getByPlaceholder(/buscar/i).clear();
    await page.waitForTimeout(500);
    
    // Deberían aparecer todos
    await expect(page.getByText('Empresa Alpha')).toBeVisible();
    await expect(page.getByText('Empresa Beta')).toBeVisible();
    await expect(page.getByText('Compañía Gamma')).toBeVisible();
  });

  test('should delete cliente with confirmation', async ({ page }) => {
    // Buscar cliente para eliminar
    await page.getByPlaceholder(/buscar/i).fill('TEST001');
    await page.waitForTimeout(500);

    // Click en eliminar (icono de basura)
    await page.getByRole('button', { name: /eliminar/i }).first().click();

    // Verificar modal de confirmación
    await expect(page.getByText(/¿estás seguro/i)).toBeVisible();
    await expect(page.getByText(/esta acción no se puede deshacer/i)).toBeVisible();

    // Confirmar eliminación
    await page.getByRole('button', { name: /eliminar/i }).click();

    // Verificar notificación de éxito
    await expect(page.getByText(/cliente eliminado exitosamente/i)).toBeVisible();

    // Verificar que ya no aparece en la lista
    await page.getByPlaceholder(/buscar/i).clear();
    await page.waitForTimeout(500);
    await expect(page.getByText('Empresa Alpha')).not.toBeVisible();
  });

  test('should show validation errors in form', async ({ page }) => {
    // Click en "Nuevo Cliente"
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // Intentar guardar sin llenar campos requeridos
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verificar errores de validación
    await expect(page.getByText(/el código es requerido/i)).toBeVisible();
    await expect(page.getByText(/el nombre es requerido/i)).toBeVisible();
    await expect(page.getByText(/el cuit es requerido/i)).toBeVisible();

    // Llenar CUIT con formato inválido
    await page.getByLabel(/cuit/i).fill('123');
    await page.getByLabel(/nombre/i).click(); // Trigger blur
    
    await expect(page.getByText(/formato de cuit inválido/i)).toBeVisible();

    // Llenar email con formato inválido
    await page.getByLabel(/email/i).fill('email-invalido');
    await page.getByLabel(/nombre/i).click(); // Trigger blur
    
    await expect(page.getByText(/formato de email inválido/i)).toBeVisible();
  });
});