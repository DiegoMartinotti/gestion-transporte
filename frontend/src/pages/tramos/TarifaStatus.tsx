import React from 'react';
import { Stack, Group, Badge, Text } from '@mantine/core';
import { Tramo } from '../../types';
import {
  getTarifaData,
  formatDate,
  isDateExpired,
  isDateExpiringSoon,
  hasTarifa,
  getTarifaStatusColors,
  getTarifaStatusWeight,
  getTarifaStatusSuffix,
} from './helpers/tramosPageHelpers';

interface TarifaStatusProps {
  tramo: Tramo;
}

const TarifaStatus: React.FC<TarifaStatusProps> = ({ tramo }) => {
  const tarifaData = getTarifaData(tramo);

  if (!hasTarifa(tramo)) {
    return (
      <Badge color="red" size="sm">
        Sin tarifa
      </Badge>
    );
  }

  const isExpired = isDateExpired(tarifaData.vigenciaHasta);
  const isExpiringSoon = isDateExpiringSoon(tarifaData.vigenciaHasta);

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Badge color="blue" size="sm">
          {tarifaData.tipo}
        </Badge>
        <Badge color="green" size="sm">
          {tarifaData.metodoCalculo}
        </Badge>
        <Text size="sm" fw={500}>
          ${tarifaData.valor}
        </Text>
        {tarifaData.valorPeaje && tarifaData.valorPeaje > 0 && (
          <Text size="sm" fw={500} c="orange">
            Peaje: ${tarifaData.valorPeaje}
          </Text>
        )}
      </Group>
      <Stack gap={2}>
        <Text size="xs" c="dimmed">
          Desde: {formatDate(tarifaData.vigenciaDesde)}
        </Text>
        <Text
          size="xs"
          c={getTarifaStatusColors(isExpired, isExpiringSoon)}
          fw={getTarifaStatusWeight(isExpired, isExpiringSoon)}
        >
          Hasta: {formatDate(tarifaData.vigenciaHasta)}
          {getTarifaStatusSuffix(isExpired, isExpiringSoon)}
        </Text>
      </Stack>
    </Stack>
  );
};

export default TarifaStatus;
