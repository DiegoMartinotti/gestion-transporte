import React, { useState, useEffect } from 'react';
import { Stack, Button, Group, Tabs, Modal, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Site, Cliente, Tramo } from '../../types';
import TarifaForm from './TarifaForm';
import { tramoValidationRules, getInitialTramoValues } from './validation/tramoValidation';
import { filterSitesByClient } from './helpers/tramoHelpers';
import TramoBasicPanel from './components/TramoBasicPanel';
import TramoTarifasPanel from './components/TramoTarifasPanel';
import { useTramoHandlers } from './hooks/useTramoHandlers';
import { useTarifaModal } from './hooks/useTarifaModal';

interface TramoFormProps {
  tramo?: Tramo | null;
  clientes: Cliente[];
  sites: Site[];
  onSubmit: (data: ReturnType<typeof getInitialTramoValues>) => void;
  onCancel: () => void;
}

const TramoForm: React.FC<TramoFormProps> = ({ tramo, clientes, sites, onSubmit, onCancel }) => {
  const [sitesFiltered, setSitesFiltered] = useState<Site[]>([]);

  const form = useForm({
    initialValues: getInitialTramoValues(tramo),
    validate: tramoValidationRules,
  });

  const {
    calculatingDistance,
    conflicts,
    validatingConflicts,
    handleValidateTarifaConflicts,
    handleCalculateDistance,
    handleSubmit,
  } = useTramoHandlers(form, sitesFiltered, onSubmit);

  const {
    selectedTarifa,
    tarifaModalOpened,
    closeTarifaModal,
    handleAddTarifa,
    handleEditTarifa,
    handleDeleteTarifa,
    handleTarifaSubmit,
  } = useTarifaModal(form);

  // Filtrar sites por cliente seleccionado
  useEffect(() => {
    filterSitesByClient(form.values.cliente, sites, form, setSitesFiltered);
  }, [form.values.cliente, sites, form]);

  // Validar conflictos cuando cambien las tarifas
  useEffect(() => {
    if (form.values.tarifasHistoricas.length > 0) {
      handleValidateTarifaConflicts();
    }
  }, [form.values.tarifasHistoricas, handleValidateTarifaConflicts]);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Tabs defaultValue="basico">
          <Tabs.List>
            <Tabs.Tab value="basico">Datos Básicos</Tabs.Tab>
            <Tabs.Tab value="tarifas">Tarifas ({form.values.tarifasHistoricas.length})</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basico">
            <TramoBasicPanel
              form={form}
              clientes={clientes}
              sitesFiltered={sitesFiltered}
              calculatingDistance={calculatingDistance}
              onCalculateDistance={handleCalculateDistance}
            />
          </Tabs.Panel>

          <Tabs.Panel value="tarifas">
            <TramoTarifasPanel
              form={form}
              conflicts={conflicts}
              onAddTarifa={handleAddTarifa}
              onEditTarifa={handleEditTarifa}
              onDeleteTarifa={handleDeleteTarifa}
            />
          </Tabs.Panel>
        </Tabs>

        <Divider />

        <Group justify="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" loading={validatingConflicts} disabled={conflicts.length > 0}>
            {tramo ? 'Actualizar' : 'Crear'} Tramo
          </Button>
        </Group>
      </Stack>

      <Modal
        opened={tarifaModalOpened}
        onClose={closeTarifaModal}
        title={selectedTarifa ? 'Editar Tarifa' : 'Nueva Tarifa'}
        size="lg"
      >
        <TarifaForm
          tarifa={selectedTarifa}
          onSubmit={handleTarifaSubmit}
          onCancel={closeTarifaModal}
          existingTarifas={form.values.tarifasHistoricas}
        />
      </Modal>
    </form>
  );
};

export default TramoForm;
