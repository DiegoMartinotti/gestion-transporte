import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cliente } from '../types';
import { clienteService } from '../services/clienteService';

interface UseClienteFormLogicProps {
  id?: string;
}

export function useClienteFormLogic({ id }: UseClienteFormLogicProps) {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(id);
  const pageTitle = isEditing ? 'Editar Cliente' : 'Nuevo Cliente';

  const loadCliente = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await clienteService.getById(id);
      setCliente(response);
    } catch (error) {
      console.error('Error loading cliente:', error);
      let errorMessage = 'Error al cargar el cliente';

      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing && id) {
      loadCliente();
    }
  }, [id, isEditing, loadCliente]);

  const handleSuccess = (cliente: Cliente) => {
    navigate(`/clientes/${cliente._id}`);
  };

  const handleCancel = () => {
    if (isEditing && id) {
      navigate(`/clientes/${id}`);
    } else {
      navigate('/clientes');
    }
  };

  return {
    cliente,
    loading,
    error,
    isEditing,
    pageTitle,
    handleSuccess,
    handleCancel,
  };
}
