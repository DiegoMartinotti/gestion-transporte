import React from 'react';
import { Stack, Paper, Title, Alert } from '@mantine/core';
import TarifaHistorial from '../../tables/TarifaHistorial';
import { TarifaHistorica } from '../TramoDetail.types';

interface TramoTarifasTabProps {
  tarifasVigentes: TarifaHistorica[];
  tarifasFuturas: TarifaHistorica[];
  tarifasPasadas: TarifaHistorica[];
  totalTarifas: number;
}

const TramoTarifasTab: React.FC<TramoTarifasTabProps> = ({
  tarifasVigentes,
  tarifasFuturas,
  tarifasPasadas,
  totalTarifas,
}) => {
  return (
    <Stack gap="md">
      {tarifasVigentes.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={5} mb="md">
            Tarifas Vigentes
          </Title>
          <TarifaHistorial tarifas={tarifasVigentes} readonly={true} />
        </Paper>
      )}

      {tarifasFuturas.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={5} mb="md">
            Tarifas Futuras
          </Title>
          <TarifaHistorial tarifas={tarifasFuturas} readonly={true} />
        </Paper>
      )}

      {tarifasPasadas.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={5} mb="md">
            Tarifas Históricas
          </Title>
          <TarifaHistorial tarifas={tarifasPasadas} readonly={true} />
        </Paper>
      )}

      {totalTarifas === 0 && (
        <Alert color="yellow" title="Sin tarifas">
          Este tramo no tiene tarifas configuradas.
        </Alert>
      )}
    </Stack>
  );
};

export default TramoTarifasTab;
