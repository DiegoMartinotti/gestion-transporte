import React from 'react';
import { Title, Text } from '@mantine/core';

/**
 * Header del sistema de tarifas
 */
export const TarifasPageHeader: React.FC = () => {
  return (
    <div>
      <Title order={1}>Sistema de Tarifas Flexibles</Title>
      <Text size="lg" c="dimmed" mt="sm">
        Gestiona métodos de cálculo, reglas de negocio, simulaciones y auditoría del sistema de
        tarifas
      </Text>
    </div>
  );
};
