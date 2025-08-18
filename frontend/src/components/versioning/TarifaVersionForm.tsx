import React from 'react';
import { Stack, Grid, Select, NumberInput, Textarea, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { TarifaVersion } from '../../services/tarifaService';

interface TarifaVersionFormProps {
  editingVersion: TarifaVersion | null;
  newVersion: Partial<TarifaVersion>;
  onDateChange: (field: 'fechaVigenciaInicio' | 'fechaVigenciaFin', value: string | null) => void;
  onTipoCalculoChange: (value: string | null) => void;
  onTarifaChange: (vehicleType: keyof TarifaVersion['tarifasPorTipo'], value: number) => void;
  onFormulaChange: (formula: string) => void;
}

const getTipoCalculoOptions = () => [
  { value: 'peso', label: 'Por Peso (Tn)' },
  { value: 'volumen', label: 'Por Volumen (m³)' },
  { value: 'distancia', label: 'Por Distancia (Km)' },
  { value: 'tiempo', label: 'Por Tiempo (Hs)' },
  { value: 'fija', label: 'Tarifa Fija' },
  { value: 'formula', label: 'Fórmula Personalizada' },
];

const getDateValue = (
  version: TarifaVersion | null,
  newVersion: Partial<TarifaVersion>,
  field: string
) => {
  if (version) {
    return field === 'fechaVigenciaInicio'
      ? new Date(version.fechaVigenciaInicio)
      : version.fechaVigenciaFin
        ? new Date(version.fechaVigenciaFin)
        : undefined;
  }
  return field === 'fechaVigenciaInicio'
    ? new Date(newVersion.fechaVigenciaInicio || '')
    : undefined;
};

export const TarifaVersionForm: React.FC<TarifaVersionFormProps> = ({
  editingVersion,
  newVersion,
  onDateChange,
  onTipoCalculoChange,
  onTarifaChange,
  onFormulaChange,
}) => {
  return (
    <Stack gap="md">
      <Grid>
        <Grid.Col span={6}>
          <DateInput
            label="Fecha Inicio Vigencia"
            required
            value={getDateValue(editingVersion, newVersion, 'fechaVigenciaInicio')}
            onChange={(value: string | null) => onDateChange('fechaVigenciaInicio', value)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <DateInput
            label="Fecha Fin Vigencia (Opcional)"
            value={getDateValue(editingVersion, newVersion, 'fechaVigenciaFin')}
            onChange={(value: string | null) => onDateChange('fechaVigenciaFin', value)}
          />
        </Grid.Col>
      </Grid>

      <Select
        label="Tipo de Cálculo"
        required
        value={editingVersion?.tipoCalculo || newVersion.tipoCalculo}
        onChange={onTipoCalculoChange}
        data={getTipoCalculoOptions()}
      />

      <Title order={6}>Tarifas por Tipo de Camión</Title>
      <Grid>
        <Grid.Col span={6}>
          <NumberInput
            label="Camión Chico"
            min={0}
            value={editingVersion?.tarifasPorTipo.chico || newVersion.tarifasPorTipo?.chico}
            onChange={(value) => onTarifaChange('chico', Number(value) || 0)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <NumberInput
            label="Semi"
            min={0}
            value={editingVersion?.tarifasPorTipo.semi || newVersion.tarifasPorTipo?.semi}
            onChange={(value) => onTarifaChange('semi', Number(value) || 0)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <NumberInput
            label="Acoplado"
            min={0}
            value={editingVersion?.tarifasPorTipo.acoplado || newVersion.tarifasPorTipo?.acoplado}
            onChange={(value) => onTarifaChange('acoplado', Number(value) || 0)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <NumberInput
            label="Bitrén"
            min={0}
            value={editingVersion?.tarifasPorTipo.bitrén || newVersion.tarifasPorTipo?.bitrén}
            onChange={(value) => onTarifaChange('bitrén', Number(value) || 0)}
          />
        </Grid.Col>
      </Grid>

      {(editingVersion?.tipoCalculo || newVersion.tipoCalculo) === 'formula' && (
        <Textarea
          label="Fórmula Personalizada"
          placeholder="Ej: peso * 150 + distancia * 2.5"
          value={editingVersion?.formula || newVersion.formula || ''}
          onChange={(event) => onFormulaChange(event.currentTarget.value)}
        />
      )}
    </Stack>
  );
};
