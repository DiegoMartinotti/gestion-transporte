import React, { useState, useEffect } from 'react';
import {
  Stack,
  Grid,
  Button,
  Group,
  Select,
  NumberInput,
  Alert,
  Text,
  Paper,
  Badge
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';

interface TarifaHistorica {
  _id?: string;
  tipo: 'TRMC' | 'TRMI';
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  valorPeaje: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

interface TarifaFormProps {
  tarifa?: TarifaHistorica | null;
  onSubmit: (data: Omit<TarifaHistorica, '_id'>) => void;
  onCancel: () => void;
  existingTarifas: TarifaHistorica[];
}

const TarifaForm: React.FC<TarifaFormProps> = ({
  tarifa,
  onSubmit,
  onCancel,
  existingTarifas
}) => {
  const [conflicts, setConflicts] = useState<string[]>([]);

  const form = useForm({
    initialValues: {
      tipo: (tarifa?.tipo || 'TRMC') as 'TRMC' | 'TRMI',
      metodoCalculo: (tarifa?.metodoCalculo || 'Kilometro') as 'Kilometro' | 'Palet' | 'Fijo',
      valor: tarifa?.valor || 0,
      valorPeaje: tarifa?.valorPeaje || 0,
      vigenciaDesde: tarifa ? new Date(tarifa.vigenciaDesde) : new Date(),
      vigenciaHasta: tarifa ? new Date(tarifa.vigenciaHasta) : new Date()
    },
    validate: {
      valor: (value) => (value <= 0 ? 'El valor debe ser mayor a 0' : null),
      valorPeaje: (value) => (value < 0 ? 'El valor del peaje no puede ser negativo' : null),
      vigenciaDesde: (value) => (!value ? 'Fecha de inicio es requerida' : null),
      vigenciaHasta: (value, values) => {
        if (!value) return 'Fecha de fin es requerida';
        if (values.vigenciaDesde && value < values.vigenciaDesde) {
          return 'La fecha de fin debe ser posterior a la fecha de inicio';
        }
        return null;
      }
    }
  });

  // Validar conflictos con tarifas existentes
  const validateConflicts = () => {
    const newConflicts: string[] = [];
    const { tipo, metodoCalculo, vigenciaDesde, vigenciaHasta } = form.values;

    if (!vigenciaDesde || !vigenciaHasta) return;

    // Filtrar tarifas existentes (excluyendo la que se está editando)
    const otherTarifas = existingTarifas.filter((t, index) => {
      if (tarifa && t._id === tarifa._id) return false;
      return true;
    });

    for (const existingTarifa of otherTarifas) {
      // Solo validar conflictos si tienen el mismo tipo y método de cálculo
      if (existingTarifa.tipo === tipo && existingTarifa.metodoCalculo === metodoCalculo) {
        const existingDesde = new Date(existingTarifa.vigenciaDesde);
        const existingHasta = new Date(existingTarifa.vigenciaHasta);

        // Verificar si hay superposición de fechas
        const noOverlap = vigenciaHasta < existingDesde || vigenciaDesde > existingHasta;

        if (!noOverlap) {
          newConflicts.push(
            `Conflicto con tarifa ${existingTarifa.tipo}/${existingTarifa.metodoCalculo} vigente del ${existingDesde.toLocaleDateString()} al ${existingHasta.toLocaleDateString()}`
          );
        }
      }
    }

    setConflicts(newConflicts);
  };

  // Validar conflictos cuando cambien los valores relevantes
  useEffect(() => {
    validateConflicts();
  }, [form.values.tipo, form.values.metodoCalculo, form.values.vigenciaDesde, form.values.vigenciaHasta, validateConflicts]);

  const handleSubmit = (values: any) => {
    if (conflicts.length > 0) return;

    onSubmit({
      tipo: values.tipo,
      metodoCalculo: values.metodoCalculo,
      valor: values.valor,
      valorPeaje: values.valorPeaje,
      vigenciaDesde: values.vigenciaDesde.toISOString(),
      vigenciaHasta: values.vigenciaHasta.toISOString()
    });
  };

  const tipoOptions = [
    { value: 'TRMC', label: 'TRMC - Transporte de Carga' },
    { value: 'TRMI', label: 'TRMI - Transporte de Interno' }
  ];

  const metodoCalculoOptions = [
    { value: 'Kilometro', label: 'Por Kilómetro' },
    { value: 'Palet', label: 'Por Palet' },
    { value: 'Fijo', label: 'Tarifa Fija' }
  ];

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {conflicts.length > 0 && (
          <Alert 
            icon={<IconAlertTriangle size={16} />} 
            color="red" 
            title="Conflictos Detectados"
          >
            <Stack gap="xs">
              {conflicts.map((conflict, index) => (
                <Text key={index} size="sm">• {conflict}</Text>
              ))}
            </Stack>
          </Alert>
        )}

        {conflicts.length === 0 && form.isValid() && (
          <Alert 
            icon={<IconCheck size={16} />} 
            color="green" 
            title="Sin conflictos"
          >
            Esta tarifa no tiene conflictos con las tarifas existentes.
          </Alert>
        )}

        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Tipo de Tarifa"
              placeholder="Selecciona el tipo"
              data={tipoOptions}
              {...form.getInputProps('tipo')}
              required
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Select
              label="Método de Cálculo"
              placeholder="Selecciona el método"
              data={metodoCalculoOptions}
              {...form.getInputProps('metodoCalculo')}
              required
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <NumberInput
              label="Valor Base"
              placeholder="0.00"
              min={0}
              step={0.01}
              decimalScale={2}
              prefix="$"
              {...form.getInputProps('valor')}
              required
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <NumberInput
              label="Valor Peaje"
              placeholder="0.00"
              min={0}
              step={0.01}
              decimalScale={2}
              prefix="$"
              {...form.getInputProps('valorPeaje')}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <DateInput
              label="Vigencia Desde"
              placeholder="Fecha de inicio"
              {...form.getInputProps('vigenciaDesde')}
              required
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <DateInput
              label="Vigencia Hasta"
              placeholder="Fecha de fin"
              {...form.getInputProps('vigenciaHasta')}
              required
            />
          </Grid.Col>
        </Grid>

        {/* Vista previa de la tarifa */}
        <Paper p="md" withBorder bg="gray.0">
          <Text size="sm" fw={500} mb="xs">Vista Previa:</Text>
          <Group gap="xs">
            <Badge color={form.values.tipo === 'TRMC' ? 'blue' : 'green'}>
              {form.values.tipo}
            </Badge>
            <Badge color="gray">{form.values.metodoCalculo}</Badge>
            <Text size="sm">Valor: ${form.values.valor}</Text>
            {form.values.valorPeaje > 0 && (
              <Text size="sm">Peaje: ${form.values.valorPeaje}</Text>
            )}
          </Group>
          {form.values.vigenciaDesde && form.values.vigenciaHasta && (
            <Text size="xs" c="dimmed" mt="xs">
              Vigente desde {form.values.vigenciaDesde.toLocaleDateString()} hasta {form.values.vigenciaHasta.toLocaleDateString()}
            </Text>
          )}
        </Paper>

        <Group justify="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!form.isValid() || conflicts.length > 0}
          >
            {tarifa ? 'Actualizar' : 'Agregar'} Tarifa
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default TarifaForm;