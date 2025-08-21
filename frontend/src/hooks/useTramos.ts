import { useState, useEffect } from 'react';
import { Tramo } from '../types';

const DEFAULT_DATE = '2024-01-01T00:00:00Z';

export function useTramos() {
  const [tramos] = useState<Tramo[]>([
    {
      _id: '1',
      origen: { _id: '1', nombre: 'Depósito Buenos Aires', direccion: 'Av. Libertador 1234' },
      destino: { _id: '2', nombre: 'Sucursal Córdoba', direccion: 'Av. Colón 5678' },
      cliente: { _id: '1', nombre: 'Empresa ABC S.A.' },
      distancia: 704,
      tarifasHistoricas: [
        {
          _id: '1',
          tipo: 'TRMC',
          metodoCalculo: 'Kilometro',
          valor: 100,
          valorPeaje: 50,
          vigenciaDesde: '2024-01-01',
          vigenciaHasta: '2024-12-31',
        },
      ],
      createdAt: DEFAULT_DATE,
      updatedAt: DEFAULT_DATE,
    },
    {
      _id: '2',
      origen: { _id: '3', nombre: 'Puerto Rosario', direccion: 'Puerto Norte' },
      destino: { _id: '4', nombre: 'Bodega Mendoza', direccion: 'Ruta 40 Km 15' },
      cliente: { _id: '2', nombre: 'Distribuidora XYZ' },
      distancia: 580,
      tarifasHistoricas: [
        {
          _id: '2',
          tipo: 'TRMI',
          metodoCalculo: 'Palet',
          valor: 150,
          valorPeaje: 30,
          vigenciaDesde: '2024-01-01',
          vigenciaHasta: '2024-12-31',
        },
      ],
      createdAt: DEFAULT_DATE,
      updatedAt: DEFAULT_DATE,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const fetchTramos = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTramos();
  }, []);

  return { tramos, loading, error, fetchTramos };
}
