import { useState, useEffect } from 'react';
import { Viaje, ViajeFormData } from '../types/viaje';

export function useViajes() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos simulados para testing
  const viajesSimulados: Viaje[] = [
    {
      _id: '1',
      numeroViaje: '1001',
      fecha: '2025-07-01T10:00:00Z',
      cliente: {
        _id: 'cliente1',
        nombre: 'Empresa ABC S.A.'
      },
      tramo: {
        _id: 'tramo1',
        denominacion: 'Buenos Aires - Córdoba',
        origen: {
          _id: 'site1',
          denominacion: 'Depósito Buenos Aires',
          direccion: 'Av. Libertador 1234, CABA'
        },
        destino: {
          _id: 'site2',
          denominacion: 'Sucursal Córdoba',
          direccion: 'Av. Colón 5678, Córdoba Capital'
        },
        distanciaKm: 704,
        tiempoEstimadoHoras: 8
      },
      vehiculos: [
        {
          _id: 'vehiculo1',
          patente: 'ABC123',
          marca: 'Mercedes-Benz',
          modelo: 'Axor',
          tipo: 'Camión',
          capacidadKg: 15000
        }
      ],
      choferes: [
        {
          _id: 'chofer1',
          nombre: 'Juan',
          apellido: 'Pérez',
          licenciaNumero: 'B123456789'
        }
      ],
      ayudantes: [],
      carga: {
        peso: 12000,
        volumen: 45,
        descripcion: 'Productos electrónicos',
        peligrosa: false,
        refrigerada: false
      },
      distanciaKm: 704,
      tiempoEstimadoHoras: 8,
      ordenCompra: '2025-001',
      observaciones: 'Entrega en horario de oficina',
      extras: [
        {
          id: '1',
          concepto: 'Combustible adicional',
          monto: 5000,
          descripcion: 'Por desvío en ruta'
        }
      ],
      estado: 'PENDIENTE',
      montoBase: 85000,
      montoExtras: 5000,
      montoTotal: 90000,
      total: 90000,
      origen: 'Puerto Buenos Aires',
      destino: 'Rosario Centro',
      estadoPartida: 'Abierta',
      totalCobrado: 0,
      createdAt: '2025-07-01T08:00:00Z',
      updatedAt: '2025-07-01T08:00:00Z'
    },
    {
      _id: '2',
      numeroViaje: '1002',
      fecha: '2025-07-01T14:00:00Z',
      cliente: {
        _id: 'cliente2',
        nombre: 'Distribuidora XYZ'
      },
      tramo: {
        _id: 'tramo2',
        denominacion: 'Rosario - Mendoza',
        origen: {
          _id: 'site3',
          denominacion: 'Puerto Rosario',
          direccion: 'Puerto Norte, Rosario'
        },
        destino: {
          _id: 'site4',
          denominacion: 'Bodega Mendoza',
          direccion: 'Ruta 40 Km 15, Mendoza'
        },
        distanciaKm: 580,
        tiempoEstimadoHoras: 7
      },
      vehiculos: [
        {
          _id: 'vehiculo2',
          patente: 'DEF456',
          marca: 'Volvo',
          modelo: 'FH',
          tipo: 'Camión',
          capacidadKg: 18000
        }
      ],
      choferes: [
        {
          _id: 'chofer2',
          nombre: 'Carlos',
          apellido: 'González',
          licenciaNumero: 'B987654321'
        }
      ],
      ayudantes: [
        {
          _id: 'ayudante1',
          nombre: 'Miguel',
          apellido: 'López'
        }
      ],
      carga: {
        peso: 16000,
        volumen: 60,
        descripcion: 'Productos alimenticios',
        peligrosa: false,
        refrigerada: true
      },
      distanciaKm: 580,
      tiempoEstimadoHoras: 7,
      observaciones: 'Mantener cadena de frío',
      extras: [],
      estado: 'EN_PROGRESO',
      montoBase: 75000,
      montoExtras: 0,
      montoTotal: 75000,
      total: 75000,
      origen: 'La Plata Industrial',
      destino: 'Córdoba Capital',
      estadoPartida: 'Abierta',
      totalCobrado: 25000,
      createdAt: '2025-07-01T10:00:00Z',
      updatedAt: '2025-07-01T12:00:00Z'
    },
    {
      _id: '3',
      numeroViaje: '1003',
      fecha: '2025-06-30T16:00:00Z',
      cliente: {
        _id: 'cliente1',
        nombre: 'Empresa ABC S.A.'
      },
      tramo: {
        _id: 'tramo3',
        denominacion: 'La Plata - Mar del Plata',
        origen: {
          _id: 'site5',
          denominacion: 'Fábrica La Plata',
          direccion: 'Calle 44 y 120, La Plata'
        },
        destino: {
          _id: 'site6',
          denominacion: 'Puerto Mar del Plata',
          direccion: 'Puerto Comercial, Mar del Plata'
        },
        distanciaKm: 400,
        tiempoEstimadoHoras: 5
      },
      vehiculos: [
        {
          _id: 'vehiculo3',
          patente: 'GHI789',
          marca: 'Scania',
          modelo: 'R450',
          tipo: 'Camión',
          capacidadKg: 20000
        }
      ],
      choferes: [
        {
          _id: 'chofer3',
          nombre: 'Roberto',
          apellido: 'Martínez',
          licenciaNumero: 'B456789123'
        }
      ],
      ayudantes: [],
      carga: {
        peso: 8000,
        volumen: 30,
        descripcion: 'Materiales de construcción',
        peligrosa: false,
        refrigerada: false
      },
      distanciaKm: 400,
      tiempoEstimadoHoras: 5,
      observaciones: '',
      extras: [],
      estado: 'COMPLETADO',
      montoBase: 45000,
      montoExtras: 0,
      montoTotal: 45000,
      total: 45000,
      origen: 'Puerto Buenos Aires',
      destino: 'Mar del Plata Puerto',
      estadoPartida: 'Cerrada',
      totalCobrado: 45000,
      createdAt: '2025-06-30T14:00:00Z',
      updatedAt: '2025-06-30T21:00:00Z'
    }
  ];

  const fetchViajes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setViajes(viajesSimulados);
    } catch (err) {
      setError('Error al cargar los viajes');
    } finally {
      setLoading(false);
    }
  };

  const createViaje = async (viajeData: ViajeFormData) => {
    setLoading(true);
    try {
      // Simular creación
      await new Promise(resolve => setTimeout(resolve, 500));
      const nuevoViaje: Viaje = {
        _id: Date.now().toString(),
        numeroViaje: (Math.max(...viajes.map(v => parseInt(v.numeroViaje))) + 1).toString(),
        fecha: viajeData.fecha.toISOString(),
        cliente: { _id: viajeData.cliente, nombre: 'Cliente Simulado' },
        tramo: { 
          _id: viajeData.tramo, 
          denominacion: 'Tramo Simulado',
          origen: { _id: '1', denominacion: 'Origen' },
          destino: { _id: '2', denominacion: 'Destino' }
        },
        vehiculos: [],
        choferes: [],
        ayudantes: [],
        carga: viajeData.carga,
        distanciaKm: viajeData.distanciaKm,
        tiempoEstimadoHoras: viajeData.tiempoEstimadoHoras,
        ordenCompra: viajeData.ordenCompra,
        observaciones: viajeData.observaciones,
        extras: viajeData.extras,
        estado: viajeData.estado as any,
        montoBase: viajeData.montoBase,
        montoExtras: viajeData.montoExtras,
        montoTotal: viajeData.montoTotal,
        total: viajeData.montoTotal,
        origen: 'Origen Simulado',
        destino: 'Destino Simulado',
        estadoPartida: 'Abierta',
        totalCobrado: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setViajes(prev => [...prev, nuevoViaje]);
    } finally {
      setLoading(false);
    }
  };

  const updateViaje = async (id: string, viajeData: Partial<ViajeFormData>) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setViajes(prev => prev.map(v => 
        v._id === id ? { 
          ...v, 
          ...viajeData, 
          fecha: typeof viajeData.fecha === 'object' ? viajeData.fecha.toISOString() : viajeData.fecha || v.fecha,
          updatedAt: new Date().toISOString() 
        } as Viaje : v
      ));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViajes();
  }, []);

  return {
    viajes,
    loading,
    error,
    fetchViajes,
    createViaje,
    updateViaje
  };
}