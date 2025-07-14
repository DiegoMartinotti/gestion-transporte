import { useState, useEffect } from 'react';
import { Viaje, ViajeFormData } from '../types/viaje';
import { ViajeService } from '../services/viajeService';

export function useViajes() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchViajes = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching viajes...');
      const response = await ViajeService.getAll({}, 1, 1000); // Obtener todos los viajes
      console.log('Response from ViajeService:', response);
      setViajes(response.data || []);
      console.log('Viajes set:', response.data?.length || 0);
    } catch (err: any) {
      console.error('Error fetching viajes:', err);
      setError(err.message || 'Error al cargar los viajes');
    } finally {
      setLoading(false);
    }
  };

  const createViaje = async (viajeData: ViajeFormData) => {
    setLoading(true);
    try {
      const nuevoViaje = await ViajeService.create(viajeData);
      setViajes(prev => [...prev, nuevoViaje]);
    } catch (err: any) {
      setError(err.message || 'Error al crear el viaje');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateViaje = async (id: string, viajeData: Partial<ViajeFormData>) => {
    setLoading(true);
    try {
      const viajeActualizado = await ViajeService.update(id, viajeData);
      setViajes(prev => prev.map(v => 
        v._id === id ? viajeActualizado : v
      ));
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el viaje');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteViaje = async (id: string) => {
    setLoading(true);
    try {
      await ViajeService.delete(id);
      setViajes(prev => prev.filter(v => v._id !== id));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el viaje');
      throw err;
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
    updateViaje,
    deleteViaje
  };
}