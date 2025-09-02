import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import ClienteForm from '../../src/components/forms/ClienteForm';
import { clienteService } from '../../src/services/clienteService';

// Mock del servicio
jest.mock('../../src/services/clienteService');
const mockClienteService = clienteService as jest.Mocked<typeof clienteService>;

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      <Notifications />
      {component}
    </MantineProvider>
  );
};

describe('ClienteForm Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create new cliente successfully', async () => {
    const mockOnSuccess = jest.fn();
    mockClienteService.create.mockResolvedValue({
      _id: '1',
      codigo: 'CLI001',
      nombre: 'Cliente Test',
      cuit: '20-12345678-9',
      contacto: {
        email: 'test@test.com',
        telefono: '123456789',
      },
      direccion: {
        calle: 'Calle Test',
        numero: '123',
        ciudad: 'Buenos Aires',
        provincia: 'Buenos Aires',
        codigoPostal: '1000',
      },
      activo: true,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    });

    renderWithProviders(<ClienteForm onSubmit={mockOnSuccess} onCancel={() => {}} />);

    // Llenar el formulario
    fireEvent.change(screen.getByLabelText(/código/i), {
      target: { value: 'CLI001' },
    });

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Cliente Test' },
    });

    fireEvent.change(screen.getByLabelText(/cuit/i), {
      target: { value: '20-12345678-9' },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });

    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: '123456789' },
    });

    // Submit del formulario
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(mockClienteService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo: 'CLI001',
          nombre: 'Cliente Test',
          cuit: '20-12345678-9',
          contacto: expect.objectContaining({
            email: 'test@test.com',
            telefono: '123456789',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should edit existing cliente successfully', async () => {
    const existingCliente = {
      _id: '1',
      codigo: 'CLI001',
      nombre: 'Cliente Existente',
      cuit: '20-12345678-9',
      contacto: {
        email: 'existing@test.com',
        telefono: '123456789',
      },
      direccion: {
        calle: 'Calle Existente',
        numero: '123',
        ciudad: 'Buenos Aires',
        provincia: 'Buenos Aires',
        codigoPostal: '1000',
      },
      activo: true,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    const mockOnSuccess = jest.fn();
    mockClienteService.update.mockResolvedValue({
      ...existingCliente,
      nombre: 'Cliente Actualizado',
    });

    renderWithProviders(
      <ClienteForm cliente={existingCliente} onSubmit={mockOnSuccess} onCancel={() => {}} />
    );

    // El formulario debería estar pre-llenado
    expect(screen.getByDisplayValue('Cliente Existente')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CLI001')).toBeInTheDocument();

    // Editar el nombre
    const nombreInput = screen.getByDisplayValue('Cliente Existente');
    fireEvent.change(nombreInput, {
      target: { value: 'Cliente Actualizado' },
    });

    // Submit del formulario
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(mockClienteService.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          nombre: 'Cliente Actualizado',
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should show validation errors', async () => {
    renderWithProviders(<ClienteForm onSubmit={() => {}} onCancel={() => {}} />);

    // Submit sin llenar campos requeridos
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText(/el código es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/el cuit es requerido/i)).toBeInTheDocument();
    });

    // No debería llamar al servicio
    expect(mockClienteService.create).not.toHaveBeenCalled();
  });

  it('should validate CUIT format', async () => {
    renderWithProviders(<ClienteForm onSubmit={() => {}} onCancel={() => {}} />);

    // Ingresar CUIT inválido
    fireEvent.change(screen.getByLabelText(/cuit/i), {
      target: { value: '12345' },
    });

    fireEvent.blur(screen.getByLabelText(/cuit/i));

    await waitFor(() => {
      expect(screen.getByText(/formato de cuit inválido/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    renderWithProviders(<ClienteForm onSubmit={() => {}} onCancel={() => {}} />);

    // Ingresar email inválido
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'email-invalido' },
    });

    fireEvent.blur(screen.getByLabelText(/email/i));

    await waitFor(() => {
      expect(screen.getByText(/formato de email inválido/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    const mockOnSuccess = jest.fn();
    mockClienteService.create.mockRejectedValue(new Error('Error del servidor'));

    renderWithProviders(<ClienteForm onSubmit={mockOnSuccess} onCancel={() => {}} />);

    // Llenar el formulario con datos válidos
    fireEvent.change(screen.getByLabelText(/código/i), {
      target: { value: 'CLI001' },
    });

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Cliente Test' },
    });

    fireEvent.change(screen.getByLabelText(/cuit/i), {
      target: { value: '20-12345678-9' },
    });

    // Submit del formulario
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al guardar el cliente/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const mockOnCancel = jest.fn();

    renderWithProviders(<ClienteForm onSubmit={() => {}} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
