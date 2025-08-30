import React from 'react';
import { Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { CalculatorState } from '../types/calculatorTypes';

export interface AlertsSectionProps {
  state: CalculatorState;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ state }) => (
  <>
    {state.error && (
      <Alert icon={<IconAlertTriangle size={16} />} color="red" mb="md">
        {state.error}
      </Alert>
    )}
    {!state.isValid && !state.error && (
      <Alert icon={<IconAlertTriangle size={16} />} color="yellow" mb="md">
        Configuración incompleta o valores inválidos
      </Alert>
    )}
  </>
);
