import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Card,
  Group,
  Button,
  Stack,
  Title,
  Text,
  Grid,
  Select,
  NumberInput,
  TextInput,
  Textarea,
  Badge,
  Alert,
  Divider,
  Paper,
  ActionIcon,
  Stepper,
  Switch,
  Modal,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconPlus,
  IconTrash,
  IconCalculator,
  IconDeviceFloppy,
  IconMapPin,
  IconTruck,
  IconClock,
  IconCurrencyDollar,
  IconInfoCircle,
  IconCheck,
} from '@tabler/icons-react';
import { ClienteSelector } from '../../components/selectors/ClienteSelector';
import { TramoSelector } from '../../components/selectors/TramoSelector';
import { VehiculoSelector } from '../../components/selectors/VehiculoSelector';
import { PersonalSelector } from '../../components/selectors/PersonalSelector';
import { TarifaCalculator } from '../../components/calculation/TarifaCalculator';
import { useClientes } from '../../hooks/useClientes';
import { useTramos } from '../../hooks/useTramos';
import { useViajes } from '../../hooks/useViajes';
import { Viaje, ViajeFormData } from '../../types/viaje';
import { notifications } from '@mantine/notifications';
import { simulateCalculation, getInitialVehiculos, getDefaultFormValues } from './helpers/viajeFormUtils';
import { useViajeForm } from './hooks/useViajeForm';

interface ViajeFormProps {
  viaje?: Viaje;
  onSave: (viaje: ViajeFormData) => void;
  onCancel: () => void;
}


  result.montoTotal = result.montoBase + result.montoExtras;
  return result;
};

// Helper function for showing notifications
const showNotification = (type: 'success' | 'error', title: string, message: string) => {
  notifications.show({
    title,
    message,
    color: type === 'success' ? 'green' : 'red',
  });
};

// Helper function for form submission
const submitViaje = async (
  viaje: Viaje | undefined,
  values: ViajeFormData,
  updateViaje: (id: string, data: ViajeFormData) => Promise<void>,
  createViaje: (data: ViajeFormData) => Promise<void>
) => {
  if (viaje) {
    await updateViaje(viaje._id, values);
    showNotification('success', 'Viaje actualizado', 'Los cambios se guardaron correctamente');
  } else {
    await createViaje(values);
    showNotification('success', 'Viaje creado', 'El viaje se registró correctamente');
  }
};

// Hook personalizado para manejo de stepper
const useStepper = (maxSteps: number) => {
  const [activeStep, setActiveStep] = useState(0);

  const nextStep = () =>
    setActiveStep((current) => (current < maxSteps - 1 ? current + 1 : current));
  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  return { activeStep, setActiveStep, nextStep, prevStep };
};

// Hook personalizado para manejo de cálculos
const useViajeCalculation = () => {
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  return { calculating, setCalculating, calculationResult, setCalculationResult };
};

// Helper para datos básicos del viaje
const getBasicData = (viaje?: Viaje) => ({
  fecha: viaje?.fecha ? new Date(viaje.fecha) : new Date(),
  cliente: typeof viaje?.cliente === 'string' ? viaje.cliente : viaje?.cliente?._id || '',
  tramo: viaje?.tramo?._id || '',
  numeroViaje: parseInt(viaje?.numeroViaje || '0'),
});

// Helper para datos de carga
const getCargoData = (viaje?: Viaje) => ({
  peso: viaje?.carga?.peso || 0,
  volumen: viaje?.carga?.volumen || 0,
  descripcion: viaje?.carga?.descripcion || '',
  peligrosa: viaje?.carga?.peligrosa || false,
  refrigerada: viaje?.carga?.refrigerada || false,
});

// Helper para datos adicionales
const getAdditionalData = (viaje?: Viaje) => ({
  distanciaKm: viaje?.distanciaKm || 0,
  tiempoEstimadoHoras: viaje?.tiempoEstimadoHoras || 0,
  ordenCompra: viaje?.ordenCompra || '',
  observaciones: viaje?.observaciones || '',
  extras: viaje?.extras || [],
  estado: viaje?.estado || 'PENDIENTE',
});

// Helper para datos monetarios
const getMonetaryData = (viaje?: Viaje) => ({
  montoBase: viaje?.montoBase || 0,
  montoExtras: viaje?.montoExtras || 0,
  montoTotal: viaje?.montoTotal || 0,
});

// Helper para valores iniciales del formulario
const getInitialFormValues = (viaje?: Viaje): ViajeFormData => ({
  ...getBasicData(viaje),
  vehiculos: getInitialVehiculos(viaje),
  choferes: viaje?.choferes?.map((c) => c._id) || [],
  ayudantes: viaje?.ayudantes?.map((a) => a._id) || [],
  carga: getCargoData(viaje),
  ...getAdditionalData(viaje),
  ...getMonetaryData(viaje),
});

// Hook para la lógica del formulario
const useViajeForm = (viaje: Viaje | undefined, activeStep: number) => {
  return useForm<ViajeFormData>({
    initialValues: getInitialFormValues(viaje),
    validate: (values) => {
      switch (activeStep) {
        case 0:
          return validateBasicInfo(values);
        case 1:
          return validateVehicleInfo(values);
        case 2:
          return validateCargoInfo(values);
        default:
          return {};
      }
    },
  });
};

// Hook para el estado de selección
const useSelectedEntities = (form: any, clientes: any[], tramos: any[]) => {
  const [selectedTramo, setSelectedTramo] = useState<any>(null);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  useEffect(() => {
    if (form.values.cliente) {
      const cliente = clientes.find((c) => c._id === form.values.cliente);
      setSelectedCliente(cliente);
    }
  }, [form.values.cliente, clientes]);

  useEffect(() => {
    if (form.values.tramo) {
      const tramo = tramos.find((t) => t._id === form.values.tramo);
      setSelectedTramo(tramo);
      if (tramo?.distanciaKm) {
        form.setFieldValue('distanciaKm', tramo.distanciaKm);
      }
      if (tramo?.tiempoEstimadoHoras) {
        form.setFieldValue('tiempoEstimadoHoras', tramo.tiempoEstimadoHoras);
      }
    }
  }, [form.values.tramo, tramos, form]);

  return { selectedTramo, selectedCliente };
};

// Hook para handlers del formulario
const useViajeHandlers = (
  viaje: Viaje | undefined,
  form: any,
  selectedCliente: any,
  selectedTramo: any,
  setCalculating: (value: boolean) => void,
  setCalculationResult: (value: any) => void,
  createViaje: any,
  updateViaje: any,
  onSave: (values: ViajeFormData) => void
) => {
  const handleCalculateTarifa = async () => {
    if (!selectedCliente || !selectedTramo) {
      showNotification('error', 'Error', 'Selecciona cliente y tramo antes de calcular');
      return;
    }

    setCalculating(true);
    try {
      const result = simulateCalculation(form.values);
      setCalculationResult(result);
      form.setFieldValue('montoBase', result.montoBase);
      form.setFieldValue('montoExtras', result.montoExtras);
      form.setFieldValue('montoTotal', result.montoTotal);
      showNotification(
        'success',
        'Cálculo completado',
        `Monto total: $${result.montoTotal.toLocaleString()}`
      );
    } catch (error) {
      showNotification('error', 'Error en cálculo', 'No se pudo calcular la tarifa');
    } finally {
      setCalculating(false);
    }
  };

  const handleAddExtra = () => {
    const newExtra = {
      id: Date.now().toString(),
      concepto: '',
      monto: 0,
      descripcion: '',
    };
    form.setFieldValue('extras', [...form.values.extras, newExtra]);
  };

  const handleRemoveExtra = (index: number) => {
    const newExtras = form.values.extras.filter((_: any, i: number) => i !== index);
    form.setFieldValue('extras', newExtras);
  };

  const handleSubmit = async (values: ViajeFormData) => {
    try {
      await submitViaje(viaje, values, updateViaje, createViaje);
      onSave(values);
    } catch (error) {
      showNotification('error', 'Error', 'No se pudo guardar el viaje');
    }
  };

  return { handleCalculateTarifa, handleAddExtra, handleRemoveExtra, handleSubmit };
};

export function ViajeForm({ viaje, onSave, onCancel }: ViajeFormProps) {
  const { activeStep, setActiveStep, nextStep, prevStep } = useStepper(4);
  const { calculating, setCalculating, calculationResult, setCalculationResult } =
    useViajeCalculation();
  const [showTarifaDetails, setShowTarifaDetails] = useState(false);

  const { clientes } = useClientes();
  const { tramos } = useTramos();
  const { createViaje, updateViaje } = useViajes();

  const form = useViajeForm(viaje, activeStep);
  const { selectedTramo, selectedCliente } = useSelectedEntities(form, clientes, tramos);
  const { handleCalculateTarifa, handleAddExtra, handleRemoveExtra, handleSubmit } =
    useViajeHandlers(
      viaje,
      form,
      selectedCliente,
      selectedTramo,
      setCalculating,
      setCalculationResult,
      createViaje,
      updateViaje,
      onSave
    );

  const handleNextStep = () => {
    const errors = form.validate();
    if (Object.keys(errors.errors).length === 0) {
      nextStep();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const getFormErrorAsString = (error: any) => (typeof error === 'string' ? error : undefined);
  const isArrayValue = (value: any) => (Array.isArray(value) ? value : []);
  const getNumberValue = (value: any) => (typeof value === 'number' ? value : 0);

  return (
    <Stack>
      <Group justify="apart">
        <Title order={2}>{viaje ? `Editar Viaje #${viaje.numeroViaje}` : 'Nuevo Viaje'}</Title>
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
                    error={getFormErrorAsString(form.errors.cliente)}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TramoSelector
                    label="Tramo/Ruta"
                    placeholder="Selecciona el tramo"
                    value={form.values.tramo}
                    onChange={(value) => form.setFieldValue('tramo', value || '')}
                    error={getFormErrorAsString(form.errors.tramo)}
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
                    <Badge color="blue">{selectedTramo.distanciaKm} km</Badge>
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
                onChange={(value) => form.setFieldValue('vehiculos', isArrayValue(value))}
                multiple
                error={getFormErrorAsString(form.errors.vehiculos)}
                required
              />

              <Grid>
                <Grid.Col span={6}>
                  <PersonalSelector
                    label="Choferes"
                    placeholder="Selecciona los choferes"
                    value={form.values.choferes}
                    onChange={(value) => form.setFieldValue('choferes', isArrayValue(value))}
                    tipo="Conductor"
                    multiple
                    error={getFormErrorAsString(form.errors.choferes)}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <PersonalSelector
                    label="Ayudantes"
                    placeholder="Selecciona los ayudantes"
                    value={form.values.ayudantes}
                    onChange={(value) => form.setFieldValue('ayudantes', isArrayValue(value))}
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
                      { value: 'FACTURADO', label: 'Facturado' },
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
                <Button leftSection={<IconPlus />} variant="light" onClick={handleAddExtra}>
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
                          newExtras[index].monto = getNumberValue(value);
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
          <Button onClick={handleNextStep} disabled={activeStep === 3}>
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
                vehiculos: form.values.vehiculos.length,
              }}
              resultado={calculationResult}
            />
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
