import { useState, useEffect } from 'react';
import { Cliente } from '../types/cliente';

const DEFAULT_DATE = '2024-01-01T00:00:00Z';

export function useClientes() {
  const [clientes] = useState<Cliente[]>([
    {
      _id: '1',
      nombre: 'Empresa ABC S.A.',
      email: 'contacto@abc.com',
      activo: true,
      createdAt: DEFAULT_DATE,
      updatedAt: DEFAULT_DATE,
    },
    {
      _id: '2',
      nombre: 'Distribuidora XYZ',
      email: 'ventas@xyz.com',
      activo: true,
      createdAt: DEFAULT_DATE,
      updatedAt: DEFAULT_DATE,
    },
    {
      _id: '3',
      nombre: 'Logística del Sur',
      email: 'info@sur.com',
      activo: true,
      createdAt: DEFAULT_DATE,
      updatedAt: DEFAULT_DATE,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return { clientes, loading, error, fetchClientes };
}
