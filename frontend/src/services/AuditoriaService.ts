import { notifications } from '@mantine/notifications';
import { IEntradaAuditoria, AuditoriaFilters } from '../types/tarifa';
import { Cliente } from '../types';

// Mock service - en producción sería un servicio real
export const auditoriaService = {
  getAll: async (filters?: AuditoriaFilters) => {
    // Simulación de datos de auditoría
    const data: IEntradaAuditoria[] = [
      {
        _id: '1',
        fecha: '2024-01-15T10:30:00Z',
        cliente: 'Cliente ABC',
        tramo: 'Buenos Aires → Córdoba',
        viaje: 'V001',
        metodoCalculo: 'DISTANCIA_PALET',
        contexto: {
          distancia: 700,
          palets: 25,
          fecha: '2024-01-15',
          vehiculo: 'ABC123',
        },
        valoresEntrada: {
          valorBase: 15000,
          peaje: 2500,
          extras: 1000,
        },
        valoresSalida: {
          tarifaFinal: 13500,
          peajeFinal: 2500,
          extrasFinal: 1000,
          total: 17000,
        },
        reglasAplicadas: ['DESC_VOLUMEN'],
        tiempoCalculo: 45,
        formula: 'SI(Palets > 20, Valor * 0.9, Valor) + Peaje + Extras',
        variables: {
          Palets: 25,
          Valor: 15000,
          Peaje: 2500,
          Extras: 1000,
        },
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        _id: '2',
        fecha: '2024-01-15T11:00:00Z',
        cliente: 'Cliente XYZ',
        tramo: 'Rosario → Mendoza',
        viaje: 'V002',
        metodoCalculo: 'DISTANCIA_PALET',
        contexto: {
          distancia: 650,
          palets: 15,
          fecha: '2024-01-15',
        },
        valoresEntrada: {
          valorBase: 12000,
          peaje: 1800,
          extras: 500,
        },
        valoresSalida: {
          tarifaFinal: 12000,
          peajeFinal: 1800,
          extrasFinal: 500,
          total: 14300,
        },
        reglasAplicadas: [],
        tiempoCalculo: 32,
        errores: ['Variable Vehiculo no encontrada'],
        formula: 'Valor + Peaje + Extras + SI(Vehiculo = "Premium", 1000, 0)',
        variables: {
          Palets: 15,
          Valor: 12000,
          Peaje: 1800,
          Extras: 500,
        },
        createdAt: '2024-01-15T11:00:00Z',
      },
    ];

    // Aplicar filtros simulados
    let filtered = data;
    if (filters?.conErrores) {
      filtered = filtered.filter((entry) => entry.errores && entry.errores.length > 0);
    }
    if (filters?.cliente) {
      const clienteFilter = filters.cliente;
      filtered = filtered.filter((entry) => entry.cliente.includes(clienteFilter));
    }
    if (filters?.metodoCalculo) {
      const metodoFilter = filters.metodoCalculo;
      filtered = filtered.filter((entry) => entry.metodoCalculo === metodoFilter);
    }

    return {
      data: filtered,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: filtered.length,
        itemsPerPage: 50,
      },
    };
  },

  getMetrics: async (_filters?: AuditoriaFilters) => {
    const metricsData = {
      totalCalculos: 1250,
      calculosConErrores: 45,
      tiempoPromedioMs: 38.5,
      tiempoMaximoMs: 150,
      reglasAplicadas: 890,
      metodosUsados: {
        DISTANCIA_PALET: 750,
        FIJO: 300,
        PESO: 200,
      },
      erroresComunes: [
        {
          tipo: 'Variable no encontrada',
          cantidad: 25,
          descripcion: 'Variable no definida en el contexto',
        },
        { tipo: 'División por cero', cantidad: 12, descripcion: 'Operación matemática inválida' },
        { tipo: 'Sintaxis inválida', cantidad: 8, descripcion: 'Error de sintaxis en la fórmula' },
      ],
      tendenciaSemanal: [
        { fecha: '2024-01-08', calculos: 180, errores: 8, tiempoPromedio: 42 },
        { fecha: '2024-01-09', calculos: 195, errores: 6, tiempoPromedio: 38 },
        { fecha: '2024-01-10', calculos: 175, errores: 9, tiempoPromedio: 41 },
        { fecha: '2024-01-11', calculos: 210, errores: 5, tiempoPromedio: 35 },
        { fecha: '2024-01-12', calculos: 225, errores: 7, tiempoPromedio: 37 },
        { fecha: '2024-01-13', calculos: 185, errores: 6, tiempoPromedio: 39 },
        { fecha: '2024-01-14', calculos: 200, errores: 4, tiempoPromedio: 36 },
      ],
    };
    return {
      data: [metricsData],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 50,
      },
    };
  },

  exportar: async (_filtros: AuditoriaFilters, formato: 'excel' | 'pdf') => {
    console.log(`Exportando auditoría a ${formato}`);
    notifications.show({
      title: 'Éxito',
      message: `Auditoría exportada a ${formato.toUpperCase()}`,
      color: 'green',
    });
  },
};

export const clienteService = {
  getAll: async () => ({
    data: [
      { _id: '1', nombre: 'Cliente ABC' },
      { _id: '2', nombre: 'Cliente XYZ' },
    ] as Cliente[],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      itemsPerPage: 50,
    },
  }),
};
