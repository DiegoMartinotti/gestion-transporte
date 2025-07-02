import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { 
  Card, Group, Button, Stack, Title, Text, Grid, Select, NumberInput, 
  TextInput, Textarea, Badge, Alert, Divider, Paper, ActionIcon,
  Stepper, Switch, Modal, Table, Tooltip, Progress
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { 
  IconPlus, IconTrash, IconCalculator, IconDeviceFloppy, IconX, 
  IconMapPin, IconTruck, IconUser, IconClock, IconCurrencyDollar,
  IconAlertCircle, IconInfoCircle, IconCheck, IconArrowRight
} from '@tabler/icons-react';
import { ClienteSelector } from '../../components/selectors/ClienteSelector';
import { TramoSelector } from '../../components/selectors/TramoSelector';
import { VehiculoSelector } from '../../components/selectors/VehiculoSelector';
import { PersonalSelector } from '../../components/selectors/PersonalSelector';
import { VariableHelper } from '../../components/base/VariableHelper';
import { TarifaCalculator } from '../../components/calculation/TarifaCalculator';
import { useClientes } from '../../hooks/useClientes';
import { useTramos } from '../../hooks/useTramos';
import { useViajes } from '../../hooks/useViajes';
import { Viaje, ViajeFormData } from '../../types/viaje';
import { notifications } from '@mantine/notifications';

interface ViajeFormProps {
  viaje?: Viaje;
  onSave: (viaje: ViajeFormData) => void;
  onCancel: () => void;
}

export function ViajeForm({ viaje, onSave, onCancel }: ViajeFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [showTarifaDetails, setShowTarifaDetails] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [selectedTramo, setSelectedTramo] = useState<any>(null);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  const { clientes } = useClientes();
  const { tramos } = useTramos();
  const { createViaje, updateViaje } = useViajes();

  const form = useForm<ViajeFormData>({
    initialValues: {
      fecha: viaje?.fecha ? new Date(viaje.fecha) : new Date(),
      cliente: viaje?.cliente?._id || '',
      tramo: viaje?.tramo?._id || '',
      numeroViaje: parseInt(viaje?.numeroViaje || '0'),
      vehiculos: viaje?.vehiculos?.map(v => v._id) || [],
      choferes: viaje?.choferes?.map(c => c._id) || [],
      ayudantes: viaje?.ayudantes?.map(a => a._id) || [],
      carga: {
        peso: viaje?.carga?.peso || 0,
        volumen: viaje?.carga?.volumen || 0,
        descripcion: viaje?.carga?.descripcion || '',
        peligrosa: viaje?.carga?.peligrosa || false,
        refrigerada: viaje?.carga?.refrigerada || false
      },
      distanciaKm: viaje?.distanciaKm || 0,
      tiempoEstimadoHoras: viaje?.tiempoEstimadoHoras || 0,
      ordenCompra: viaje?.ordenCompra || '',
      observaciones: viaje?.observaciones || '',
      extras: viaje?.extras || [],
      estado: viaje?.estado || 'PENDIENTE',
      montoBase: viaje?.montoBase || 0,
      montoExtras: viaje?.montoExtras || 0,
      montoTotal: viaje?.montoTotal || 0
    },
    validate: (values) => {
      const errors: any = {};
      
      if (activeStep === 0) {
        if (!values.fecha) errors.fecha = 'Fecha requerida';
        if (!values.cliente) errors.cliente = 'Cliente requerido';
        if (!values.tramo) errors.tramo = 'Tramo requerido';
      }
      
      if (activeStep === 1) {
        if (!values.vehiculos.length) errors.vehiculos = 'Al menos un vehículo requerido';
        if (!values.choferes.length) errors.choferes = 'Al menos un chofer requerido';
      }
      
      if (activeStep === 2) {
        if (!values.carga.peso || values.carga.peso <= 0) {
          errors['carga.peso'] = 'Peso de carga requerido';
        }
        if (!values.distanciaKm || values.distanciaKm <= 0) {
          errors.distanciaKm = 'Distancia requerida';
        }
      }
      
      return errors;
    }
  });

  useEffect(() => {
    if (form.values.cliente) {
      const cliente = clientes.find(c => c._id === form.values.cliente);
      setSelectedCliente(cliente);
    }
  }, [form.values.cliente, clientes]);

  useEffect(() => {
    if (form.values.tramo) {
      const tramo = tramos.find(t => t._id === form.values.tramo);
      setSelectedTramo(tramo);
      if (tramo?.distanciaKm) {
        form.setFieldValue('distanciaKm', tramo.distanciaKm);
      }
      if (tramo?.tiempoEstimadoHoras) {
        form.setFieldValue('tiempoEstimadoHoras', tramo.tiempoEstimadoHoras);
      }
    }
  }, [form.values.tramo, tramos]);

  const handleCalculateTarifa = async () => {
    if (!selectedCliente || !selectedTramo) {
      notifications.show({
        title: 'Error',
        message: 'Selecciona cliente y tramo antes de calcular',
        color: 'red'
      });
      return;
    }

    setCalculating(true);
    try {
      const calculationData = {
        clienteId: form.values.cliente,
        tramoId: form.values.tramo,
        peso: form.values.carga.peso,
        volumen: form.values.carga.volumen,
        distancia: form.values.distanciaKm,
        tiempo: form.values.tiempoEstimadoHoras,
        vehiculos: form.values.vehiculos.length,
        fecha: form.values.fecha,
        extras: form.values.extras
      };

      // Simulación del cálculo
      const result = {
        montoBase: 15000,
        desglose: {
          tarifaBase: 12000,
          incrementoPeso: 2000,
          incrementoDistancia: 1000
        },
        formula: 'tarifaBase + (peso * 0.5) + (distancia * 10)',
        montoExtras: form.values.extras.reduce((sum, extra) => sum + (extra.monto || 0), 0),
        montoTotal: 0
      };

      result.montoTotal = result.montoBase + result.montoExtras;

      setCalculationResult(result);
      form.setFieldValue('montoBase', result.montoBase);
      form.setFieldValue('montoExtras', result.montoExtras);
      form.setFieldValue('montoTotal', result.montoTotal);

      notifications.show({
        title: 'Cálculo completado',
        message: `Monto total: $${result.montoTotal.toLocaleString()}`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error en cálculo',
        message: 'No se pudo calcular la tarifa',
        color: 'red'
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleAddExtra = () => {
    const newExtra = {
      id: Date.now().toString(),
      concepto: '',
      monto: 0,
      descripcion: ''
    };
    form.setFieldValue('extras', [...form.values.extras, newExtra]);
  };

  const handleRemoveExtra = (index: number) => {
    const newExtras = form.values.extras.filter((_, i) => i !== index);
    form.setFieldValue('extras', newExtras);
  };

  const handleSubmit = async (values: ViajeFormData) => {
    try {
      if (viaje) {
        await updateViaje(viaje._id, values);
        notifications.show({
          title: 'Viaje actualizado',
          message: 'Los cambios se guardaron correctamente',
          color: 'green'
        });
      } else {
        await createViaje(values);
        notifications.show({
          title: 'Viaje creado',
          message: 'El viaje se registró correctamente',
          color: 'green'
        });
      }
      onSave(values);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo guardar el viaje',
        color: 'red'
      });
    }
  };

  const nextStep = () => {
    const errors = form.validate();
    if (Object.keys(errors.errors).length === 0) {
      setActiveStep((current) => (current < 3 ? current + 1 : current));
    }
  };

  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  return (
    <Stack>
      <Group justify="apart">
        <Title order={2}>
          {viaje ? `Editar Viaje #${viaje.numeroViaje}` : 'Nuevo Viaje'}
        </Title>
        <Group>
          <Button variant="light" color="gray" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            leftSection={<IconDeviceFloppy />}
            onClick={() => handleSubmit(form.values)}
            disabled={activeStep < 3}
          >
            Guardar Viaje
          </Button>
        </Group>
      </Group>

      <Card>
        <Stepper active={activeStep} onStepClick={setActiveStep}>
          <Stepper.Step 
            label="Información Básica" 
            description="Cliente, ruta y fecha"
            icon={<IconInfoCircle />}
          >
            <Stack mt="md">
              <Grid>
                <Grid.Col span={6}>
                  <DateInput
                    label="Fecha del Viaje"
                    placeholder="Selecciona la fecha"
                    {...form.getInputProps('fecha')}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <NumberInput
                    label="Número de Viaje"
                    placeholder="Número automático"
                    {...form.getInputProps('numeroViaje')}
                    disabled
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={6}>
                  <ClienteSelector
                    label="Cliente"
                    placeholder="Selecciona el cliente"
                    value={form.values.cliente}
                    onChange={(value) => form.setFieldValue('cliente', value || '')}
                    error={typeof form.errors.cliente === 'string' ? form.errors.cliente : undefined}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TramoSelector
                    label="Tramo/Ruta"
                    placeholder="Selecciona el tramo"
                    value={form.values.tramo}
                    onChange={(value) => form.setFieldValue('tramo', value || '')}
                    clienteId={form.values.cliente}
                    error={typeof form.errors.tramo === 'string' ? form.errors.tramo : undefined}
                    required
                  />
                </Grid.Col>
              </Grid>

              {selectedTramo && (
                <Alert icon={<IconMapPin />} color="blue">
                  <Group justify="apart">
                    <div>
                      <Text fw={500}>{selectedTramo.denominacion}</Text>
                      <Text size="sm" c="dimmed">
                        {selectedTramo.origen?.denominacion} → {selectedTramo.destino?.denominacion}
                      </Text>
                    </div>
                    <Badge color="blue">
                      {selectedTramo.distanciaKm} km
                    </Badge>
                  </Group>
                </Alert>
              )}

              <TextInput
                label="Orden de Compra"
                placeholder="Número de OC (opcional)"
                {...form.getInputProps('ordenCompra')}
              />
            </Stack>
          </Stepper.Step>

          <Stepper.Step 
            label="Vehículos y Personal" 
            description="Asignación de recursos"
            icon={<IconTruck />}
          >
            <Stack mt="md">
              <VehiculoSelector
                label="Vehículos"
                placeholder="Selecciona los vehículos"
                value={form.values.vehiculos}
                onChange={(value) => form.setFieldValue('vehiculos', Array.isArray(value) ? value : [])}
                multiple
                error={typeof form.errors.vehiculos === 'string' ? form.errors.vehiculos : undefined}
                required
              />

              <Grid>
                <Grid.Col span={6}>
                  <PersonalSelector
                    label="Choferes"
                    placeholder="Selecciona los choferes"
                    value={form.values.choferes}
                    onChange={(value) => form.setFieldValue('choferes', Array.isArray(value) ? value : [])}
                    tipo="Conductor"
                    multiple
                    error={typeof form.errors.choferes === 'string' ? form.errors.choferes : undefined}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <PersonalSelector
                    label="Ayudantes"
                    placeholder="Selecciona los ayudantes"
                    value={form.values.ayudantes}
                    onChange={(value) => form.setFieldValue('ayudantes', Array.isArray(value) ? value : [])}
                    tipo="Ayudante"
                    multiple
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Stepper.Step>

          <Stepper.Step 
            label="Detalles de Carga" 
            description="Información del transporte"
            icon={<IconClock />}
          >
            <Stack mt="md">
              <Grid>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Peso (kg)"
                    placeholder="Peso de la carga"
                    {...form.getInputProps('carga.peso')}
                    min={0}
                    decimalScale={2}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Volumen (m³)"
                    placeholder="Volumen de la carga"
                    {...form.getInputProps('carga.volumen')}
                    min={0}
                    decimalScale={2}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Distancia (km)"
                    placeholder="Distancia del viaje"
                    {...form.getInputProps('distanciaKm')}
                    min={0}
                    decimalScale={1}
                    required
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={6}>
                  <NumberInput
                    label="Tiempo Estimado (horas)"
                    placeholder="Duración estimada"
                    {...form.getInputProps('tiempoEstimadoHoras')}
                    min={0}
                    decimalScale={1}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Estado del Viaje"
                    placeholder="Estado actual"
                    data={[
                      { value: 'PENDIENTE', label: 'Pendiente' },
                      { value: 'EN_PROGRESO', label: 'En Progreso' },
                      { value: 'COMPLETADO', label: 'Completado' },
                      { value: 'CANCELADO', label: 'Cancelado' },
                      { value: 'FACTURADO', label: 'Facturado' }
                    ]}
                    {...form.getInputProps('estado')}
                  />
                </Grid.Col>
              </Grid>

              <Textarea
                label="Descripción de la Carga"
                placeholder="Describe el tipo de carga..."
                {...form.getInputProps('carga.descripcion')}
                minRows={2}
              />

              <Group>
                <Switch
                  label="Carga Peligrosa"
                  {...form.getInputProps('carga.peligrosa', { type: 'checkbox' })}
                />
                <Switch
                  label="Carga Refrigerada"
                  {...form.getInputProps('carga.refrigerada', { type: 'checkbox' })}
                />
              </Group>

              <Textarea
                label="Observaciones"
                placeholder="Notas adicionales sobre el viaje..."
                {...form.getInputProps('observaciones')}
                minRows={2}
              />
            </Stack>
          </Stepper.Step>

          <Stepper.Step 
            label="Cálculo y Facturación" 
            description="Tarifas y costos"
            icon={<IconCurrencyDollar />}
          >
            <Stack mt="md">
              <Group justify="apart">
                <Text fw={500}>Cálculo de Tarifa</Text>
                <Group>
                  <Button
                    leftSection={<IconCalculator />}
                    onClick={handleCalculateTarifa}
                    loading={calculating}
                    disabled={!form.values.cliente || !form.values.tramo}
                  >
                    Calcular Tarifa
                  </Button>
                  {calculationResult && (
                    <Button
                      variant="light"
                      leftSection={<IconInfoCircle />}
                      onClick={() => setShowTarifaDetails(true)}
                    >
                      Ver Detalles
                    </Button>
                  )}
                </Group>
              </Group>

              {calculationResult && (
                <Paper p="md" withBorder>
                  <Grid>
                    <Grid.Col span={4}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Monto Base
                      </Text>
                      <Text size="lg" fw={700}>
                        {formatCurrency(calculationResult.montoBase)}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Extras
                      </Text>
                      <Text size="lg" fw={700}>
                        {formatCurrency(calculationResult.montoExtras)}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Total
                      </Text>
                      <Text size="xl" fw={700} c="green">
                        {formatCurrency(calculationResult.montoTotal)}
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Paper>
              )}

              <Divider label="Extras" labelPosition="left" />

              <Group justify="apart">
                <Text fw={500}>Cargos Adicionales</Text>
                <Button
                  leftSection={<IconPlus />}
                  variant="light"
                  onClick={handleAddExtra}
                >
                  Agregar Extra
                </Button>
              </Group>

              {form.values.extras.map((extra, index) => (
                <Paper key={extra.id} p="md" withBorder>
                  <Grid>
                    <Grid.Col span={4}>
                      <TextInput
                        label="Concepto"
                        placeholder="Descripción del extra"
                        value={extra.concepto}
                        onChange={(e) => {
                          const newExtras = [...form.values.extras];
                          newExtras[index].concepto = e.target.value;
                          form.setFieldValue('extras', newExtras);
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <NumberInput
                        label="Monto"
                        placeholder="0.00"
                        value={extra.monto}
                        onChange={(value) => {
                          const newExtras = [...form.values.extras];
                          newExtras[index].monto = typeof value === 'number' ? value : 0;
                          form.setFieldValue('extras', newExtras);
                        }}
                        decimalScale={2}
                        min={0}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <TextInput
                        label="Descripción"
                        placeholder="Detalles adicionales"
                        value={extra.descripcion}
                        onChange={(e) => {
                          const newExtras = [...form.values.extras];
                          newExtras[index].descripcion = e.target.value;
                          form.setFieldValue('extras', newExtras);
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={1}>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleRemoveExtra(index)}
                        style={{ marginTop: 25 }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Grid.Col>
                  </Grid>
                </Paper>
              ))}

              {form.values.extras.length === 0 && (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No hay extras agregados
                </Text>
              )}
            </Stack>
          </Stepper.Step>

          <Stepper.Completed>
            <Alert icon={<IconCheck />} color="green">
              <Text fw={500}>Viaje listo para guardar</Text>
              <Text size="sm">
                Revisa todos los datos antes de confirmar el guardado del viaje.
              </Text>
            </Alert>
          </Stepper.Completed>
        </Stepper>

        <Group justify="center" mt="xl">
          <Button variant="default" onClick={prevStep} disabled={activeStep === 0}>
            Anterior
          </Button>
          <Button onClick={nextStep} disabled={activeStep === 3}>
            Siguiente
          </Button>
        </Group>
      </Card>

      <Modal
        opened={showTarifaDetails}
        onClose={() => setShowTarifaDetails(false)}
        title="Detalles del Cálculo"
        size="lg"
      >
        {calculationResult && (
          <Stack>
            <TarifaCalculator
              cliente={selectedCliente}
              tramo={selectedTramo}
              datos={{
                peso: form.values.carga.peso,
                volumen: form.values.carga.volumen,
                distancia: form.values.distanciaKm,
                vehiculos: form.values.vehiculos.length
              }}
              resultado={calculationResult}
            />
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}