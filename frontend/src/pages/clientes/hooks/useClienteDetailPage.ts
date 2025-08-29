import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { Cliente } from '../../../types';
import { clienteService } from '../../../services/clienteService';

export const useClienteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('general');

  const loadCliente = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await clienteService.getById(id);
      setCliente(response);
    } catch (error: unknown) {
      console.error('Error loading cliente:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message
        : 'Error al cargar el cliente';
      setError(errorMessage || 'Error al cargar el cliente');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCliente();
    }
  }, [id, loadCliente]);

  const handleEdit = () => {
    navigate(`/clientes/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!cliente) return;
    
    try {
      setDeleteLoading(true);
      await clienteService.delete(cliente._id);
      
      notifications.show({
        title: 'Cliente eliminado',
        message: `El cliente "${cliente.nombre}" ha sido eliminado correctamente`,
        color: 'green'
      });
      
      navigate('/clientes');
    } catch (error: unknown) {
      console.error('Error deleting cliente:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message
        : 'Error al eliminar el cliente';
      notifications.show({
        title: 'Error',
        message: errorMessage || 'Error al eliminar el cliente',
        color: 'red'
      });
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpened(false);
    }
  };

  const handleViewSites = (cliente: Cliente) => {
    navigate(`/clientes/${cliente._id}/sites`);
  };

  const handleViewTramos = (cliente: Cliente) => {
    navigate(`/clientes/${cliente._id}/tramos`);
  };

  const handleCreateSite = (cliente: Cliente) => {
    navigate(`/sites/new?cliente=${cliente._id}`);
  };

  const handleCreateTramo = (cliente: Cliente) => {
    navigate(`/tramos/new?cliente=${cliente._id}`);
  };

  const handleNavigateBack = () => {
    navigate('/clientes');
  };

  const handleFormulaChange = () => {
    console.log('Fórmulas actualizadas');
  };

  return {
    cliente,
    loading,
    error,
    deleteModalOpened,
    setDeleteModalOpened,
    deleteLoading,
    activeTab,
    setActiveTab,
    handleEdit,
    handleDelete,
    handleViewSites,
    handleViewTramos,
    handleCreateSite,
    handleCreateTramo,
    handleNavigateBack,
    handleFormulaChange,
  };
};