import { useState, useEffect } from 'react';

interface Cliente {
  _id: string;
  nombre: string;
  email?: string;
}

export function useClientes() {
  const [clientes] = useState<Cliente[]>([
    { _id: '1', nombre: 'Empresa ABC S.A.', email: 'contacto@abc.com' },
    { _id: '2', nombre: 'Distribuidora XYZ', email: 'ventas@xyz.com' },
    { _id: '3', nombre: 'Logística del Sur', email: 'info@sur.com' },
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
