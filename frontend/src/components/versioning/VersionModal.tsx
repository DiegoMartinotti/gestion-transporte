import React from 'react';
import { Modal, Stack, NumberInput, Select, Group, Button } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { TarifaVersion } from './helpers/tarifaVersioningHelpers';

interface VersionModalProps {
  opened: boolean;
  onClose: () => void;
  editingVersion: TarifaVersion | null;
  newVersion: Partial<TarifaVersion>;
  onNewVersionChange: (field: string, value: string | number | null | Record<string, any>) => void;
  onSubmit: () => void;
  isCreating: boolean;
}

const VersionModal: React.FC<VersionModalProps> = ({
  opened,
  onClose,
  editingVersion,
  newVersion,
  onNewVersionChange,
  onSubmit,
  isCreating,
}) => {
  const tipoCalculoOptions = [
    { value: 'peso', label: 'Por Peso (Tn)' },
    { value: 'volumen', label: 'Por Volumen (m³)' },
    { value: 'distancia', label: 'Por Distancia (Km)' },
    { value: 'palet', label: 'Por Palet' },
    { value: 'fijo', label: 'Tarifa Fija' },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editingVersion ? 'Editar Versión' : 'Nueva Versión'}
      size="lg"
    >
      <Stack gap="md">
        <Group grow>
          <DateInput
            label="Fecha Vigencia Inicio"
            value={newVersion.fechaVigenciaInicio ? new Date(newVersion.fechaVigenciaInicio) : null}
            onChange={(date) =>
              onNewVersionChange('fechaVigenciaInicio', date ? new Date(date).toISOString() : '')
            }
            required
          />
          <DateInput
            label="Fecha Vigencia Fin"
            value={newVersion.fechaVigenciaFin ? new Date(newVersion.fechaVigenciaFin) : null}
            onChange={(date) =>
              onNewVersionChange('fechaVigenciaFin', date ? new Date(date).toISOString() : '')
            }
          />
        </Group>

        <Select
          label="Tipo de Cálculo"
          data={tipoCalculoOptions}
          value={newVersion.tipoCalculo || ''}
          onChange={(value) => onNewVersionChange('tipoCalculo', value)}
          required
        />

        <Group grow>
          <NumberInput
            label="Tarifa Semi"
            value={newVersion.tarifasPorTipo?.semi || 0}
            onChange={(value) =>
              onNewVersionChange('tarifasPorTipo', {
                ...newVersion.tarifasPorTipo,
                semi: value || 0,
              })
            }
            min={0}
            step={0.01}
            required
          />
          <NumberInput
            label="Tarifa Acoplado"
            value={newVersion.tarifasPorTipo?.acoplado || 0}
            onChange={(value) =>
              onNewVersionChange('tarifasPorTipo', {
                ...newVersion.tarifasPorTipo,
                acoplado: value || 0,
              })
            }
            min={0}
            step={0.01}
            required
          />
        </Group>

        <Group justify="flex-end" mt="lg">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={isCreating}>
            {editingVersion ? 'Actualizar' : 'Crear'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default VersionModal;
