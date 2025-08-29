import React, { useState, useEffect } from 'react';
import { Modal, Button, Group, Tabs } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Vehiculo } from '../../types/vehiculo';
import { Empresa } from '../../types';
import { vehiculoValidationRules, getInitialVehiculoValues } from './validation/vehiculoValidation';
import { loadEmpresas, submitVehiculo } from './helpers/vehiculoHelpers';
import {
  DatosBasicosTab,
  DocumentacionTab,
  CaracteristicasTab,
} from './components/VehiculoFormTabs';

interface VehiculoFormProps {
  opened: boolean;
  onClose: () => void;
  vehiculo?: Vehiculo | null;
  onSuccess: () => void;
}

function VehiculoForm({ opened, onClose, vehiculo, onSuccess }: VehiculoFormProps) {
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('basicos');

  const form = useForm<Vehiculo>({
    initialValues: getInitialVehiculoValues(),
    validate: vehiculoValidationRules,
  });

  useEffect(() => {
    if (opened) {
      loadEmpresas(setEmpresas);

      if (vehiculo) {
        form.setValues(getInitialVehiculoValues(vehiculo));
      } else {
        form.reset();
        setActiveTab('basicos');
      }
    }
  }, [opened, vehiculo]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (values: Vehiculo) => {
    await submitVehiculo({
      values,
      vehiculo,
      onSuccess,
      onClose,
      setLoading,
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={vehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      size="xl"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Tabs value={activeTab} onChange={setActiveTab} mb="md">
          <Tabs.List>
            <Tabs.Tab value="basicos">Datos Básicos</Tabs.Tab>
            <Tabs.Tab value="documentacion">Documentación</Tabs.Tab>
            <Tabs.Tab value="caracteristicas">Características</Tabs.Tab>
          </Tabs.List>

          <DatosBasicosTab form={form} empresas={empresas} />
          <DocumentacionTab form={form} />
          <CaracteristicasTab form={form} />
        </Tabs>

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {vehiculo ? 'Actualizar' : 'Crear'} Vehículo
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

// Comparador para React.memo
const arePropsEqual = (prevProps: VehiculoFormProps, nextProps: VehiculoFormProps): boolean => {
  return (
    prevProps.opened === nextProps.opened &&
    prevProps.vehiculo?._id === nextProps.vehiculo?._id &&
    JSON.stringify(prevProps.vehiculo) === JSON.stringify(nextProps.vehiculo)
  );
};

export default React.memo(VehiculoForm, arePropsEqual);
