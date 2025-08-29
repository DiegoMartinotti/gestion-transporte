import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Viaje, ViajeFormData } from '../../../types/viaje';
import { ViajeService } from '../../../services/viajeService';

export const useViajeFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(id);
  const pageTitle = isEditing ? 'Editar Viaje' : 'Nuevo Viaje';

  const loadViaje = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await ViajeService.getById(id);
      setViaje(response);
    } catch (error: unknown) {
      console.error('Error loading viaje:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message
        : 'Error al cargar el viaje';
      setError(errorMessage || 'Error al cargar el viaje');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing && id) {
      loadViaje();
    }
  }, [id, isEditing, loadViaje]);

  const handleSave = async (viajeData: ViajeFormData) => {
    try {
      setLoading(true);
      let savedViaje: Viaje;
      
      if (isEditing && id) {
        savedViaje = await ViajeService.update(id, viajeData);
      } else {
        savedViaje = await ViajeService.create(viajeData);
      }
      
      navigate(`/viajes/${savedViaje._id}`);
    } catch (error: unknown) {
      console.error('Error saving viaje:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message
        : 'Error al guardar el viaje';
      setError(errorMessage || 'Error al guardar el viaje');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditing && id) {
      navigate(`/viajes/${id}`);
    } else {
      navigate('/viajes');
    }
  };

  const navigateToList = () => navigate('/viajes');

  return {
    viaje,
    loading,
    error,
    isEditing,
    pageTitle,
    handleSave,
    handleCancel,
    navigateToList,
  };
};