import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import TarifaCalculator from '../TarifaCalculator';

const mockTarifa = {
  _id: '1',
  tramo: '1',
  vigenciaDesde: '2023-01-01',
  vigenciaHasta: '2023-12-31',
  tipoCalculo: 'POR_VIAJE',
  importe: 100000,
  activa: true
};

const mockViaje = {
  _id: '1',
  numeroViaje: 1,
  fecha: '2023-06-01',
  distancia: 100,
  cantidadCamiones: 2,
  pesoTotal: 25000,
  horasSalida: '08:00',
  horasLlegada: '12:00',
  estado: 'PENDIENTE',
  tarifa: mockTarifa
};

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('TarifaCalculator', () => {
  it('should render calculator with viaje data', () => {
    renderWithProvider(
      <TarifaCalculator
        viaje={mockViaje}
        onCalculationChange={() => {}}
      />
    );
    
    expect(screen.getByText('Calculadora de Tarifas')).toBeInTheDocument();
    expect(screen.getByText('Viaje #1')).toBeInTheDocument();
  });

  it('should display tarifa information', () => {
    renderWithProvider(
      <TarifaCalculator
        viaje={mockViaje}
        onCalculationChange={() => {}}
      />
    );
    
    expect(screen.getByText('POR_VIAJE')).toBeInTheDocument();
    expect(screen.getByText('$100,000.00')).toBeInTheDocument();
  });

  it('should calculate total based on tipo calculo', () => {
    const mockOnCalculationChange = jest.fn();
    
    renderWithProvider(
      <TarifaCalculator
        viaje={mockViaje}
        onCalculationChange={mockOnCalculationChange}
      />
    );
    
    expect(mockOnCalculationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        total: expect.any(Number),
        desglose: expect.any(Object)
      })
    );
  });

  it('should handle POR_VIAJE calculation', () => {
    const viajeporViaje = {
      ...mockViaje,
      tarifa: { ...mockTarifa, tipoCalculo: 'POR_VIAJE' }
    };
    
    const mockOnCalculationChange = jest.fn();
    
    renderWithProvider(
      <TarifaCalculator
        viaje={viajeporViaje}
        onCalculationChange={mockOnCalculationChange}
      />
    );
    
    // Para POR_VIAJE debería multiplicar por cantidad de camiones
    expect(mockOnCalculationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 200000, // 100000 * 2 camiones
        desglose: expect.objectContaining({
          tipoCalculo: 'POR_VIAJE',
          cantidadCamiones: 2
        })
      })
    );
  });

  it('should handle POR_TONELADA calculation', () => {
    const viajePorTonelada = {
      ...mockViaje,
      tarifa: { ...mockTarifa, tipoCalculo: 'POR_TONELADA' }
    };
    
    const mockOnCalculationChange = jest.fn();
    
    renderWithProvider(
      <TarifaCalculator
        viaje={viajePorTonelada}
        onCalculationChange={mockOnCalculationChange}
      />
    );
    
    // Para POR_TONELADA debería multiplicar por peso en toneladas
    expect(mockOnCalculationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 2500000, // 100000 * 25 toneladas
        desglose: expect.objectContaining({
          tipoCalculo: 'POR_TONELADA',
          pesoToneladas: 25
        })
      })
    );
  });

  it('should handle POR_KILOMETRO calculation', () => {
    const viajePorKm = {
      ...mockViaje,
      tarifa: { ...mockTarifa, tipoCalculo: 'POR_KILOMETRO' }
    };
    
    const mockOnCalculationChange = jest.fn();
    
    renderWithProvider(
      <TarifaCalculator
        viaje={viajePorKm}
        onCalculationChange={mockOnCalculationChange}
      />
    );
    
    // Para POR_KILOMETRO debería multiplicar por distancia
    expect(mockOnCalculationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 10000000, // 100000 * 100 km
        desglose: expect.objectContaining({
          tipoCalculo: 'POR_KILOMETRO',
          distancia: 100
        })
      })
    );
  });

  it('should show breakdown details', () => {
    renderWithProvider(
      <TarifaCalculator
        viaje={mockViaje}
        onCalculationChange={() => {}}
      />
    );
    
    expect(screen.getByText('Desglose')).toBeInTheDocument();
    expect(screen.getByText('Importe Base:')).toBeInTheDocument();
    expect(screen.getByText('Cantidad Camiones:')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
  });

  it('should handle missing tarifa', () => {
    const viajesinTarifa = {
      ...mockViaje,
      tarifa: null
    };
    
    renderWithProvider(
      <TarifaCalculator
        viaje={viajesinTarifa}
        onCalculationChange={() => {}}
      />
    );
    
    expect(screen.getByText('No hay tarifa configurada')).toBeInTheDocument();
  });
});