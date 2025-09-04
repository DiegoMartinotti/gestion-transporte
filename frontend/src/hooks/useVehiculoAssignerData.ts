import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { vehiculoService } from '../services/vehiculoService';
import { personalService } from '../services/personalService';
import type { Personal, Vehiculo } from '../types';

export function useVehiculoAssignerData(empresaId?: string) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [conductores, setConductores] = useState<Personal[]>([]);
  const [acompanantes, setAcompanantes] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);

      const [vehiculosRes, personalRes] = await Promise.all([
        vehiculoService.getAll({ empresa: empresaId, activo: true }),
        personalService.getAll({ empresa: empresaId, activo: true }),
      ]);

      setVehiculos(Array.isArray(vehiculosRes.data) ? vehiculosRes.data : []);

      const personal = personalRes.data || [];
      setConductores(personal.filter((p) => p.tipo === 'Conductor'));
      setAcompanantes(personal.filter((p) => p.tipo === 'Otro'));
    } catch (error) {
      console.error('Error loading data:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cargar vehículos y personal',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    vehiculos,
    conductores,
    acompanantes,
    loading,
  };
}
