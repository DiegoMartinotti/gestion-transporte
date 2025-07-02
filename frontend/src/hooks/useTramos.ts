import { useState, useEffect } from 'react';

interface Tramo {
  _id: string;
  denominacion: string;
  origen: { _id: string; denominacion: string; direccion?: string };
  destino: { _id: string; denominacion: string; direccion?: string };
  distanciaKm: number;
  tiempoEstimadoHoras: number;
}

export function useTramos() {
  const [tramos, setTramos] = useState<Tramo[]>([
    {
      _id: '1',
      denominacion: 'Buenos Aires - Córdoba',
      origen: { _id: '1', denominacion: 'Depósito Buenos Aires', direccion: 'Av. Libertador 1234' },
      destino: { _id: '2', denominacion: 'Sucursal Córdoba', direccion: 'Av. Colón 5678' },
      distanciaKm: 704,
      tiempoEstimadoHoras: 8
    },
    {
      _id: '2',
      denominacion: 'Rosario - Mendoza',
      origen: { _id: '3', denominacion: 'Puerto Rosario', direccion: 'Puerto Norte' },
      destino: { _id: '4', denominacion: 'Bodega Mendoza', direccion: 'Ruta 40 Km 15' },
      distanciaKm: 580,
      tiempoEstimadoHoras: 7
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTramos = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTramos();
  }, []);

  return { tramos, loading, error, fetchTramos };
}