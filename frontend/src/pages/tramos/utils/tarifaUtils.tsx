import React from 'react';
import { Badge, Stack, Group, Text } from '@mantine/core';
import { Tramo } from '../../../types';
import {
  getTarifaData,
  formatDate,
  isDateExpired,
  isDateExpiringSoon,
  getTarifaStatusColors,
  getTarifaStatusWeight,
  getTarifaStatusSuffix,
} from '../helpers/tramosPageHelpers';

const renderTarifaBadges = (
  tipo: string,
  metodoCalculo: string,
  valor: number,
  valorPeaje?: number
) => (
  <Group gap="xs">
    <Badge color="blue" size="xs">
      {tipo}
    </Badge>
    <Badge color="green" size="xs">
      {metodoCalculo}
    </Badge>
    <Badge color="yellow" size="xs">
      ${valor} + ${valorPeaje || 0}
    </Badge>
  </Group>
);

const renderDateInfo = (vigenciaDesde?: string, vigenciaHasta?: string) => {
  if (!vigenciaDesde) return null;

  const isExpired = isDateExpired(vigenciaHasta);
  const isExpiringSoon = isDateExpiringSoon(vigenciaHasta);
  const color = getTarifaStatusColors(isExpired, isExpiringSoon);
  const weight = getTarifaStatusWeight(isExpired, isExpiringSoon);
  const suffix = getTarifaStatusSuffix(isExpired, isExpiringSoon);

  return (
    <Text size="xs" c={color} fw={weight}>
      {formatDate(vigenciaDesde)} - {formatDate(vigenciaHasta)}
      {suffix}
    </Text>
  );
};

export const getTarifaStatus = (tramo: Tramo) => {
  const { tipo, metodoCalculo, valor, valorPeaje, vigenciaDesde, vigenciaHasta } =
    getTarifaData(tramo);

  if (!tipo || !metodoCalculo || valor === undefined) {
    return (
      <Badge color="red" size="sm">
        Sin tarifa
      </Badge>
    );
  }

  return (
    <Stack gap="xs">
      {renderTarifaBadges(tipo, metodoCalculo, valor, valorPeaje)}
      {renderDateInfo(vigenciaDesde, vigenciaHasta)}
    </Stack>
  );
};
