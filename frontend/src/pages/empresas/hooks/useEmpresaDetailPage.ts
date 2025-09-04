import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { Empresa } from '../../../types';
import { empresaService } from '../../../services/empresaService';

export const useEmpresaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadEmpresa = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await empresaService.getById(id);
      setEmpresa(response);
    } catch (error: unknown) {
      console.error('Error loading empresa:', error);
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Error al cargar la empresa';
      setError(errorMessage || 'Error al cargar la empresa');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadEmpresa();
    }
  }, [id, loadEmpresa]);

  const handleEdit = () => {
    navigate(`/empresas/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!empresa) return;

    try {
      setDeleteLoading(true);
      await empresaService.delete(empresa._id);

      notifications.show({
        title: 'Empresa eliminada',
        message: `La empresa "${empresa.nombre}" ha sido eliminada correctamente`,
        color: 'green',
      });

      navigate('/empresas');
    } catch (error: unknown) {
      console.error('Error deleting empresa:', error);
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Error al eliminar la empresa';
      notifications.show({
        title: 'Error',
        message: errorMessage || 'Error al eliminar la empresa',
        color: 'red',
      });
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpened(false);
    }
  };

  const handleViewPersonal = (empresa: Empresa) => {
    navigate(`/empresas/${empresa._id}/personal`);
  };

  const handleViewVehiculos = (empresa: Empresa) => {
    navigate(`/empresas/${empresa._id}/vehiculos`);
  };

  const handleCreatePersonal = (empresa: Empresa) => {
    navigate(`/personal/new?empresa=${empresa._id}`);
  };

  const handleCreateVehiculo = (empresa: Empresa) => {
    navigate(`/vehiculos/new?empresa=${empresa._id}`);
  };

  const handleNavigateBack = () => {
    navigate('/empresas');
  };

  return {
    empresa,
    loading,
    error,
    deleteModalOpened,
    setDeleteModalOpened,
    deleteLoading,
    handleEdit,
    handleDelete,
    handleViewPersonal,
    handleViewVehiculos,
    handleCreatePersonal,
    handleCreateVehiculo,
    handleNavigateBack,
  };
};
