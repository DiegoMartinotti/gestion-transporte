import React from 'react';
import { Grid, Alert, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Formula } from '../../../services/formulaService';
import { FormProps } from './types';

interface VigenciaSectionProps extends FormProps {
  conflictos: Formula[];
}

export const VigenciaSection: React.FC<VigenciaSectionProps> = ({ form, conflictos }) => {
  return (
    <>
      <Grid>
        <Grid.Col span={6}>
          <DatePickerInput
            label="Vigencia desde"
            placeholder="Seleccionar fecha"
            required
            {...form.getInputProps('vigenciaDesde')}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <DatePickerInput
            label="Vigencia hasta"
            placeholder="Opcional - Sin límite si no se especifica"
            clearable
            {...form.getInputProps('vigenciaHasta')}
          />
        </Grid.Col>
      </Grid>

      {conflictos.length > 0 && (
        <Alert icon={<IconAlertTriangle size={16} />} title="Conflicto de vigencias" color="yellow">
          <Text size="sm">
            Existen {conflictos.length} fórmula(s) que se superponen en las fechas seleccionadas:
          </Text>
          {conflictos.map((conflicto) => (
            <Text key={conflicto._id} size="xs" mt={4}>
              • {conflicto.formula} ({new Date(conflicto.vigenciaDesde).toLocaleDateString()} -{' '}
              {conflicto.vigenciaHasta
                ? new Date(conflicto.vigenciaHasta).toLocaleDateString()
                : 'Sin límite'}
              )
            </Text>
          ))}
        </Alert>
      )}
    </>
  );
};
