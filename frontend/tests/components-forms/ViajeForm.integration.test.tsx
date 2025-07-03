import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import ViajeForm from '../ViajeForm';
import { viajeService } from '../../../services/viajeService';
import { clienteService } from '../../../services/clienteService';
import { tramoService } from '../../../services/tramoService';

// Mock de los servicios
jest.mock('../../../services/viajeService');
jest.mock('../../../services/clienteService');
jest.mock('../../../services/tramoService');

const mockViajeService = viajeService as jest.Mocked<typeof viajeService>;
const mockClienteService = clienteService as jest.Mocked<typeof clienteService>;
const mockTramoService = tramoService as jest.Mocked<typeof tramoService>;

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      <Notifications />
      {component}
    </MantineProvider>
  );
};

const mockClientes = [
  { _id: '1', codigo: 'CLI001', nombre: 'Cliente Test 1' },
  { _id: '2', codigo: 'CLI002', nombre: 'Cliente Test 2' }
];

const mockTramos = [
  {
    _id: '1',
    denominacion: 'Tramo Test',
    cliente: '1',
    origen: { _id: '1', denominacion: 'Origen' },
    destino: { _id: '2', denominacion: 'Destino' },
    distancia: 100,
    tarifas: [{
      _id: 'tar1',
      vigenciaDesde: '2023-01-01',
      vigenciaHasta: '2023-12-31',
      tipoCalculo: 'POR_VIAJE',
      importe: 50000,
      activa: true
    }]
  }
];

describe('ViajeForm Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClienteService.getAll.mockResolvedValue(mockClientes);
    mockTramoService.getByCliente.mockResolvedValue(mockTramos);
  });

  it('should create new viaje successfully', async () => {
    const mockOnSuccess = jest.fn();
    mockViajeService.create.mockResolvedValue({
      _id: '1',
      numeroViaje: 1,
      fecha: '2023-06-01',
      cliente: mockClientes[0],
      tramo: mockTramos[0],
      vehiculos: [],
      choferes: [],
      estado: 'PENDIENTE',
      montoTotal: 100000
    });

    renderWithProviders(
      <ViajeForm
        onSubmit={mockOnSuccess}
        onCancel={() => {}}
      />
    );

    // Esperar a que se carguen los clientes
    await waitFor(() => {
      expect(screen.getByText('Cliente Test 1')).toBeInTheDocument();
    });

    // Seleccionar cliente
    fireEvent.click(screen.getByLabelText(/cliente/i));
    fireEvent.click(screen.getByText('Cliente Test 1'));

    // Esperar a que se carguen los tramos
    await waitFor(() => {
      expect(screen.getByText('Tramo Test')).toBeInTheDocument();
    });

    // Seleccionar tramo
    fireEvent.click(screen.getByLabelText(/tramo/i));
    fireEvent.click(screen.getByText('Tramo Test'));

    // Ingresar fecha
    fireEvent.change(screen.getByLabelText(/fecha/i), {
      target: { value: '2023-06-01' }
    });

    // Submit del formulario
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(mockViajeService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fecha: '2023-06-01',
          cliente: '1',
          tramo: '1'
        })
      );
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should load tramos when cliente is selected', async () => {
    renderWithProviders(
      <ViajeForm
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    // Esperar a que se carguen los clientes
    await waitFor(() => {
      expect(screen.getByText('Cliente Test 1')).toBeInTheDocument();
    });

    // Seleccionar cliente
    fireEvent.click(screen.getByLabelText(/cliente/i));
    fireEvent.click(screen.getByText('Cliente Test 1'));

    // Verificar que se llamó el servicio de tramos
    await waitFor(() => {
      expect(mockTramoService.getByCliente).toHaveBeenCalledWith('1');
    });

    // Verificar que se muestran los tramos
    await waitFor(() => {
      expect(screen.getByText('Tramo Test')).toBeInTheDocument();
    });
  });

  it('should calculate totals when tramo is selected', async () => {
    renderWithProviders(
      <ViajeForm
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    // Seleccionar cliente y tramo
    await waitFor(() => {
      expect(screen.getByText('Cliente Test 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/cliente/i));
    fireEvent.click(screen.getByText('Cliente Test 1'));

    await waitFor(() => {
      expect(screen.getByText('Tramo Test')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/tramo/i));
    fireEvent.click(screen.getByText('Tramo Test'));

    // Verificar que se muestra la calculadora de tarifa
    await waitFor(() => {
      expect(screen.getByText(/calculadora de tarifas/i)).toBeInTheDocument();
    });

    // Verificar que se muestra el monto
    await waitFor(() => {
      expect(screen.getByText(/50\.000/)).toBeInTheDocument();
    });
  });

  it('should show validation errors for required fields', async () => {
    renderWithProviders(
      <ViajeForm
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    // Submit sin llenar campos requeridos
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText(/el cliente es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/el tramo es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/la fecha es requerida/i)).toBeInTheDocument();
    });

    expect(mockViajeService.create).not.toHaveBeenCalled();
  });

  it('should validate fecha is not in the past', async () => {
    renderWithProviders(
      <ViajeForm
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    // Ingresar fecha pasada
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    fireEvent.change(screen.getByLabelText(/fecha/i), {
      target: { value: yesterday.toISOString().split('T')[0] }
    });

    fireEvent.blur(screen.getByLabelText(/fecha/i));

    await waitFor(() => {
      expect(screen.getByText(/la fecha no puede ser anterior a hoy/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    const mockOnSuccess = jest.fn();
    mockViajeService.create.mockRejectedValue(new Error('Error del servidor'));

    renderWithProviders(
      <ViajeForm
        onSubmit={mockOnSuccess}
        onCancel={() => {}}
      />
    );

    // Llenar formulario con datos válidos
    await waitFor(() => {
      expect(screen.getByText('Cliente Test 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/cliente/i));
    fireEvent.click(screen.getByText('Cliente Test 1'));

    await waitFor(() => {
      expect(screen.getByText('Tramo Test')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/tramo/i));
    fireEvent.click(screen.getByText('Tramo Test'));

    fireEvent.change(screen.getByLabelText(/fecha/i), {
      target: { value: '2023-06-01' }
    });

    // Submit del formulario
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al guardar el viaje/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should edit existing viaje successfully', async () => {
    const existingViaje = {
      _id: '1',
      numeroViaje: 1,
      fecha: '2023-06-01',
      cliente: mockClientes[0],
      tramo: mockTramos[0],
      vehiculos: [],
      choferes: [],
      estado: 'PENDIENTE',
      montoTotal: 100000
    };

    const mockOnSuccess = jest.fn();
    mockViajeService.update.mockResolvedValue({
      ...existingViaje,
      fecha: '2023-06-02'
    });

    renderWithProviders(
      <ViajeForm
        viaje={existingViaje}
        onSubmit={mockOnSuccess}
        onCancel={() => {}}
      />
    );

    // El formulario debería estar pre-llenado
    expect(screen.getByDisplayValue('2023-06-01')).toBeInTheDocument();

    // Cambiar fecha
    fireEvent.change(screen.getByLabelText(/fecha/i), {
      target: { value: '2023-06-02' }
    });

    // Submit del formulario
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(mockViajeService.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          fecha: '2023-06-02'
        })
      );
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });
});