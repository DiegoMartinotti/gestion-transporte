import { useState, useEffect } from 'react';
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
  Switch
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { vehiculoService } from '../../services/vehiculoService';
import { empresaService } from '../../services/empresaService';
import { Vehiculo, VehiculoTipo } from '../../types/vehiculo';
import { Empresa } from '../../types';

interface VehiculoFormProps {
  opened: boolean;
  onClose: () => void;
  vehiculo?: Vehiculo | null;
  onSuccess: () => void;
}

export default function VehiculoForm({ opened, onClose, vehiculo, onSuccess }: VehiculoFormProps) {
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('basicos');

  const tiposVehiculo: VehiculoTipo[] = ['Camión', 'Acoplado', 'Semirremolque', 'Bitren', 'Furgón', 'Utilitario'];

  const form = useForm<Vehiculo>({
    initialValues: {
      dominio: '',
      tipo: 'Camión' as VehiculoTipo,
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      numeroChasis: '',
      numeroMotor: '',
      empresa: '',
      documentacion: {
        seguro: {
          numero: '',
          vencimiento: '',
          compania: ''
        },
        vtv: {
          numero: '',
          vencimiento: ''
        },
        ruta: {
          numero: '',
          vencimiento: ''
        },
        senasa: {
          numero: '',
          vencimiento: ''
        }
      },
      caracteristicas: {
        capacidadCarga: 0,
        tara: 0,
        largo: 0,
        ancho: 0,
        alto: 0,
        configuracionEjes: '',
        tipoCarroceria: ''
      },
      mantenimiento: [],
      activo: true,
      observaciones: ''
    },
    validate: {
      dominio: (value) => {
        if (!value) return 'El dominio es obligatorio';
        if (!/^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(value.toUpperCase())) {
          return 'Formato de patente inválido';
        }
        return null;
      },
      empresa: (value) => !value ? 'La empresa es obligatoria' : null,
      año: (value) => {
        if (value && (value < 1950 || value > new Date().getFullYear() + 1)) {
          return 'Año inválido';
        }
        return null;
      }
    }
  });

  useEffect(() => {
    if (opened) {
      loadEmpresas();
      
      if (vehiculo) {
        form.setValues({
          ...vehiculo,
          documentacion: {
            seguro: {
              numero: vehiculo.documentacion?.seguro?.numero || '',
              vencimiento: vehiculo.documentacion?.seguro?.vencimiento || '',
              compania: vehiculo.documentacion?.seguro?.compania || ''
            },
            vtv: {
              numero: vehiculo.documentacion?.vtv?.numero || '',
              vencimiento: vehiculo.documentacion?.vtv?.vencimiento || ''
            },
            ruta: {
              numero: vehiculo.documentacion?.ruta?.numero || '',
              vencimiento: vehiculo.documentacion?.ruta?.vencimiento || ''
            },
            senasa: {
              numero: vehiculo.documentacion?.senasa?.numero || '',
              vencimiento: vehiculo.documentacion?.senasa?.vencimiento || ''
            }
          },
          caracteristicas: {
            capacidadCarga: vehiculo.caracteristicas?.capacidadCarga || 0,
            tara: vehiculo.caracteristicas?.tara || 0,
            largo: vehiculo.caracteristicas?.largo || 0,
            ancho: vehiculo.caracteristicas?.ancho || 0,
            alto: vehiculo.caracteristicas?.alto || 0,
            configuracionEjes: vehiculo.caracteristicas?.configuracionEjes || '',
            tipoCarroceria: vehiculo.caracteristicas?.tipoCarroceria || ''
          }
        });
      } else {
        form.reset();
        setActiveTab('basicos');
      }
    }
  }, [opened, vehiculo]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEmpresas = async () => {
    try {
      const response = await empresaService.getAll();
      setEmpresas(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar las empresas',
        color: 'red'
      });
    }
  };

  const handleSubmit = async (values: Vehiculo) => {
    try {
      setLoading(true);
      
      // Convertir dominio a mayúsculas
      values.dominio = values.dominio.toUpperCase();
      if (values.numeroChasis) values.numeroChasis = values.numeroChasis.toUpperCase();
      if (values.numeroMotor) values.numeroMotor = values.numeroMotor.toUpperCase();

      if (vehiculo?._id) {
        await vehiculoService.updateVehiculo(vehiculo._id, values);
        notifications.show({
          title: 'Éxito',
          message: 'Vehículo actualizado correctamente',
          color: 'green'
        });
      } else {
        await vehiculoService.createVehiculo(values);
        notifications.show({
          title: 'Éxito',
          message: 'Vehículo creado correctamente',
          color: 'green'
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al guardar el vehículo',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
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
                    data={tiposVehiculo.map(tipo => ({ value: tipo, label: tipo }))}
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
                data={empresas.map(e => ({ value: e._id!, label: e.nombre }))}
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
                <Title order={5} mb="sm">Seguro</Title>
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
                <Title order={5} mb="sm">VTV</Title>
                <Grid>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Número"
                      {...form.getInputProps('documentacion.vtv.numero')}
                    />
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
                <Title order={5} mb="sm">Ruta</Title>
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
                <Title order={5} mb="sm">SENASA</Title>
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