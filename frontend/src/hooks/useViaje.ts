import { useState, useEffect } from 'react';
import { Viaje } from '../types/viaje';

export function useViaje(viajeId: string) {
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos simulados
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
          vehiculo: 'vehiculo1',
          posicion: 1,
          _id: 'vehiculo1'
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
      estado: 'Pendiente',
      montoBase: 85000,
      montoExtras: 5000,
      montoTotal: 90000,
      total: 90000,
      origen: 'Puerto Buenos Aires',
      destino: 'Rosario Centro',
      estadoPartida: 'Abierta',
      totalCobrado: 0,
      documentos: [
        {
          id: '1',
          nombre: 'Orden de Compra.pdf',
          url: '/docs/oc-2025-001.pdf',
          tipo: 'pdf'
        },
        {
          id: '2',
          nombre: 'Remito.pdf',
          url: '/docs/remito-001.pdf',
          tipo: 'pdf'
        }
      ],
      createdAt: '2025-07-01T08:00:00Z',
      updatedAt: '2025-07-01T08:00:00Z'
    }
  ];

  const fetchViaje = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const viajeEncontrado = viajesSimulados.find(v => v._id === viajeId);
      if (viajeEncontrado) {
        setViaje(viajeEncontrado);
      } else {
        setError('Viaje no encontrado');
      }
    } catch (err) {
      setError('Error al cargar el viaje');
    } finally {
      setLoading(false);
    }
  };

  const updateEstado = async (nuevoEstado: string) => {
    if (!viaje) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setViaje(prev => prev ? {
        ...prev,
        estado: nuevoEstado as any,
        updatedAt: new Date().toISOString()
      } : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viajeId) {
      fetchViaje();
    }
  }, [viajeId]);

  return {
    viaje,
    loading,
    error,
    fetchViaje,
    updateEstado
  };
}