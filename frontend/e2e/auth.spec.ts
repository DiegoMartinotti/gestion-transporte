import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Verificar que estamos en la página de login
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();

    // Llenar formulario de login
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');

    // Hacer click en el botón de login
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Verificar redirección al dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/bienvenido/i)).toBeVisible();

    // Verificar que el header muestra el usuario logueado
    await expect(page.getByText(/admin@test.com/i)).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Llenar formulario con credenciales inválidas
    await page.getByLabel(/usuario/i).fill('invalid@test.com');
    await page.getByLabel(/contraseña/i).fill('wrongpassword');

    // Hacer click en el botón de login
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Verificar que se muestra el error
    await expect(page.getByText(/credenciales inválidas/i)).toBeVisible();

    // Verificar que seguimos en la página de login
    await expect(page).toHaveURL('/login');
  });

  test('should validate required fields', async ({ page }) => {
    // Intentar login sin llenar campos
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Verificar errores de validación
    await expect(page.getByText(/el usuario es requerido/i)).toBeVisible();
    await expect(page.getByText(/la contraseña es requerida/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login primero
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Verificar que estamos logueados
    await expect(page).toHaveURL('/dashboard');

    // Hacer logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Confirmar logout en el modal
    await page.getByRole('button', { name: /confirmar/i }).click();

    // Verificar redirección a login
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Intentar acceder a una ruta protegida sin estar logueado
    await page.goto('/clientes');

    // Debería redirigir a login
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('should remember login state after page refresh', async ({ page }) => {
    // Login
    await page.getByLabel(/usuario/i).fill('admin@test.com');
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL('/dashboard');

    // Refrescar página
    await page.reload();

    // Verificar que seguimos logueados
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/admin@test.com/i)).toBeVisible();
  });
});