import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Select,
  NumberInput,
  Textarea,
  Button,
  Group,
  Stack,
  Grid,
  Tabs,
  Paper,
  Title,
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Vehiculo } from '../../types/vehiculo';
import { Empresa } from '../../types';
import { vehiculoValidationRules, getInitialVehiculoValues } from './validation/vehiculoValidation';
import { TIPOS_VEHICULO } from './constants/vehiculoConstants';
import { loadEmpresas, submitVehiculo } from './helpers/vehiculoHelpers';

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

  const handleSubmit = async (values: any) => {
    await submitVehiculo(values as Vehiculo, vehiculo, onSuccess, onClose, setLoading);
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

          <Tabs.Panel value="basicos">
            <Stack gap="md">
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Dominio/Patente"
                    placeholder="ABC123 o AB123CD"
                    required
                    {...form.getInputProps('dominio')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Tipo de Vehículo"
                    data={TIPOS_VEHICULO.map((tipo) => ({ value: tipo, label: tipo }))}
                    required
                    {...form.getInputProps('tipo')}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={4}>
                  <TextInput
                    label="Marca"
                    placeholder="Scania, Mercedes, etc."
                    {...form.getInputProps('marca')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Modelo"
                    placeholder="R450, Actros, etc."
                    {...form.getInputProps('modelo')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Año"
                    placeholder="2020"
                    min={1950}
                    max={new Date().getFullYear() + 1}
                    {...form.getInputProps('año')}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Número de Chasis"
                    placeholder="Número de chasis"
                    {...form.getInputProps('numeroChasis')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Número de Motor"
                    placeholder="Número de motor"
                    {...form.getInputProps('numeroMotor')}
                  />
                </Grid.Col>
              </Grid>

              <Select
                label="Empresa"
                placeholder="Seleccionar empresa"
                data={empresas.map((e) => ({ value: e._id!, label: e.nombre }))}
                searchable
                required
                {...form.getInputProps('empresa')}
              />

              <Switch
                label="Vehículo activo"
                {...form.getInputProps('activo', { type: 'checkbox' })}
              />

              <Textarea
                label="Observaciones"
                placeholder="Observaciones adicionales"
                rows={3}
                {...form.getInputProps('observaciones')}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="documentacion">
            <Stack gap="md">
              <Paper withBorder p="md">
                <Title order={5} mb="sm">
                  Seguro
                </Title>
                <Grid>
                  <Grid.Col span={4}>
                    <TextInput
                      label="Número de Póliza"
                      {...form.getInputProps('documentacion.seguro.numero')}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput
                      label="Compañía"
                      {...form.getInputProps('documentacion.seguro.compania')}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput
                      label="Vencimiento"
                      placeholder="yyyy-mm-dd"
                      type="date"
                      {...form.getInputProps('documentacion.seguro.vencimiento')}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>

              <Paper withBorder p="md">
                <Title order={5} mb="sm">
                  VTV
                </Title>
                <Grid>
                  <Grid.Col span={6}>
                    <TextInput label="Número" {...form.getInputProps('documentacion.vtv.numero')} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Vencimiento"
                      placeholder="yyyy-mm-dd"
                      type="date"
                      {...form.getInputProps('documentacion.vtv.vencimiento')}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>

              <Paper withBorder p="md">
                <Title order={5} mb="sm">
                  Ruta
                </Title>
                <Grid>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Número"
                      {...form.getInputProps('documentacion.ruta.numero')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Vencimiento"
                      placeholder="yyyy-mm-dd"
                      type="date"
                      {...form.getInputProps('documentacion.ruta.vencimiento')}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>

              <Paper withBorder p="md">
                <Title order={5} mb="sm">
                  SENASA
                </Title>
                <Grid>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Número"
                      {...form.getInputProps('documentacion.senasa.numero')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Vencimiento"
                      placeholder="yyyy-mm-dd"
                      type="date"
                      {...form.getInputProps('documentacion.senasa.vencimiento')}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="caracteristicas">
            <Stack gap="md">
              <Grid>
                <Grid.Col span={6}>
                  <NumberInput
                    label="Capacidad de Carga (kg)"
                    placeholder="0"
                    min={0}
                    {...form.getInputProps('caracteristicas.capacidadCarga')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <NumberInput
                    label="Tara - Peso Vacío (kg)"
                    placeholder="0"
                    min={0}
                    {...form.getInputProps('caracteristicas.tara')}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Largo (m)"
                    placeholder="0"
                    min={0}
                    step={0.1}
                    decimalScale={2}
                    {...form.getInputProps('caracteristicas.largo')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Ancho (m)"
                    placeholder="0"
                    min={0}
                    step={0.1}
                    decimalScale={2}
                    {...form.getInputProps('caracteristicas.ancho')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Alto (m)"
                    placeholder="0"
                    min={0}
                    step={0.1}
                    decimalScale={2}
                    {...form.getInputProps('caracteristicas.alto')}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Configuración de Ejes"
                    placeholder="4x2, 6x4, etc."
                    {...form.getInputProps('caracteristicas.configuracionEjes')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Tipo de Carrocería"
                    placeholder="Furgón, Plataforma, etc."
                    {...form.getInputProps('caracteristicas.tipoCarroceria')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Tabs.Panel>
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
