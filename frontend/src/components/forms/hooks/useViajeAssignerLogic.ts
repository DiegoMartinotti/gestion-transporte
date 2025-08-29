import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import type { Viaje } from '../../../types/viaje';
import type { ViajeItem } from '../../../types/ordenCompra';
import { getOrigenText, getDestinoText } from '../../../utils/viajeHelpers';

export const useViajeAssignerLogic = (
  viajesDisponibles: Viaje[],
  viajesExcluidos: string[],
  onAssign: (viajes: ViajeItem[]) => void,
  onClose: () => void
) => {
  const [selectedViajes, setSelectedViajes] = useState<Set<string>>(new Set());
  const [importes, setImportes] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredViajes, setFilteredViajes] = useState<Viaje[]>([]);

  useEffect(() => {
    const available = viajesDisponibles.filter((viaje) => !viajesExcluidos.includes(viaje._id));

    const filtered = available.filter((viaje) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        viaje.numeroViaje?.toString().toLowerCase().includes(searchLower) ||
        viaje.dt?.toString().toLowerCase().includes(searchLower) ||
        getOrigenText(viaje).toLowerCase().includes(searchLower) ||
        getDestinoText(viaje).toLowerCase().includes(searchLower)
      );
    });

    setFilteredViajes(filtered);
  }, [viajesDisponibles, viajesExcluidos, searchTerm]);

  const handleViajeSelect = (viajeId: string, checked: boolean) => {
    const newSelected = new Set(selectedViajes);
    if (checked) {
      newSelected.add(viajeId);
      const viaje = viajesDisponibles.find((v) => v._id === viajeId);
      if (viaje) {
        setImportes((prev) => new Map(prev).set(viajeId, viaje.total));
      }
    } else {
      newSelected.delete(viajeId);
      setImportes((prev) => {
        const newMap = new Map(prev);
        newMap.delete(viajeId);
        return newMap;
      });
    }
    setSelectedViajes(newSelected);
  };

  const handleImporteChange = (viajeId: string, importe: number) => {
    setImportes((prev) => new Map(prev).set(viajeId, importe));
  };

  const handleAssign = () => {
    if (selectedViajes.size === 0) {
      notifications.show({
        title: 'Error',
        message: 'Debe seleccionar al menos un viaje',
        color: 'red',
      });
      return;
    }

    const viajesItems: ViajeItem[] = Array.from(selectedViajes).map((viajeId) => ({
      viaje: viajeId,
      importe: importes.get(viajeId) || 0,
    }));

    const invalidViajes = viajesItems.filter((item) => item.importe <= 0);
    if (invalidViajes.length > 0) {
      notifications.show({
        title: 'Error',
        message: 'Todos los viajes deben tener un importe mayor a 0',
        color: 'red',
      });
      return;
    }

    onAssign(viajesItems);
    resetState();
  };

  const handleCancel = () => {
    resetState();
    onClose();
  };

  const resetState = () => {
    setSelectedViajes(new Set());
    setImportes(new Map());
    setSearchTerm('');
  };

  const getTotalSelected = () => {
    return Array.from(selectedViajes).reduce((total, viajeId) => {
      return total + (importes.get(viajeId) || 0);
    }, 0);
  };

  return {
    selectedViajes,
    importes,
    searchTerm,
    filteredViajes,
    handleViajeSelect,
    handleImporteChange,
    handleAssign,
    handleCancel,
    getTotalSelected,
    setSearchTerm,
  };
};
