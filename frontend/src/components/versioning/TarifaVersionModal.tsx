import React from 'react';
import { Modal, Button, Group } from '@mantine/core';
import { TarifaVersion } from '../../services/tarifaService';
import { TarifaVersionForm } from './TarifaVersionForm';

interface TarifaVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVersion: TarifaVersion | null;
  newVersion: Partial<TarifaVersion>;
  onVersionChange: (version: Partial<TarifaVersion>) => void;
  onEditingVersionChange: (version: TarifaVersion) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const updateTarifaValue = (
  currentTarifas: TarifaVersion['tarifasPorTipo'],
  vehicleType: keyof TarifaVersion['tarifasPorTipo'],
  value: number
) => ({ ...currentTarifas, [vehicleType]: value });

const useHandlers = (
  editingVersion: TarifaVersion | null,
  newVersion: Partial<TarifaVersion>,
  onVersionChange: (version: Partial<TarifaVersion>) => void,
  onEditingVersionChange: (version: TarifaVersion) => void
) => {
  const handleDateChange = (
    field: 'fechaVigenciaInicio' | 'fechaVigenciaFin',
    value: string | null
  ) => {
    const dateString = value || (field === 'fechaVigenciaInicio' ? '' : undefined);
    if (editingVersion) {
      onEditingVersionChange({ ...editingVersion, [field]: dateString });
    } else {
      onVersionChange({ ...newVersion, [field]: dateString });
    }
  };

  const handleTipoCalculoChange = (value: string | null) => {
    const tipoCalculo = value as 'peso' | 'volumen' | 'distancia' | 'tiempo' | 'fija' | 'formula';
    const update = editingVersion
      ? () => onEditingVersionChange({ ...editingVersion, tipoCalculo })
      : () => onVersionChange({ ...newVersion, tipoCalculo });
    update();
  };

  const handleTarifaChange = (
    vehicleType: keyof TarifaVersion['tarifasPorTipo'],
    value: number
  ) => {
    const currentTarifas = editingVersion?.tarifasPorTipo ||
      newVersion.tarifasPorTipo || { chico: 0, semi: 0, acoplado: 0, bitrén: 0 };
    const tarifas = updateTarifaValue(currentTarifas, vehicleType, value);
    const update = editingVersion
      ? () => onEditingVersionChange({ ...editingVersion, tarifasPorTipo: tarifas })
      : () => onVersionChange({ ...newVersion, tarifasPorTipo: tarifas });
    update();
  };

  const handleFormulaChange = (formula: string) => {
    const update = editingVersion
      ? () => onEditingVersionChange({ ...editingVersion, formula })
      : () => onVersionChange({ ...newVersion, formula });
    update();
  };

  return { handleDateChange, handleTipoCalculoChange, handleTarifaChange, handleFormulaChange };
};

export const TarifaVersionModal: React.FC<TarifaVersionModalProps> = ({
  isOpen,
  onClose,
  editingVersion,
  newVersion,
  onVersionChange,
  onEditingVersionChange,
  onSubmit,
  isLoading,
}) => {
  const { handleDateChange, handleTipoCalculoChange, handleTarifaChange, handleFormulaChange } =
    useHandlers(editingVersion, newVersion, onVersionChange, onEditingVersionChange);

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={editingVersion ? 'Editar Versión' : 'Nueva Versión de Tarifa'}
      size="lg"
    >
      <TarifaVersionForm
        editingVersion={editingVersion}
        newVersion={newVersion}
        onDateChange={handleDateChange}
        onTipoCalculoChange={handleTipoCalculoChange}
        onTarifaChange={handleTarifaChange}
        onFormulaChange={handleFormulaChange}
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} loading={isLoading}>
          {editingVersion ? 'Actualizar' : 'Crear'}
        </Button>
      </Group>
    </Modal>
  );
};
