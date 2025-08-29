import React from 'react';
import {
  Modal,
  Stack,
  Text,
  Grid,
  Paper,
  Group,
  Divider,
  Badge,
} from '@mantine/core';
import { IResultadoSimulacion } from '../../../types/tarifa';

interface DetalleResultadoModalProps {
  opened: boolean;
  onClose: () => void;
  resultado: IResultadoSimulacion | null;
}

const DetalleResultadoModal: React.FC<DetalleResultadoModalProps> = ({
  opened,
  onClose,
  resultado,
}) => {
  if (!resultado) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Detalle del Resultado"
      size="lg"
    >
      <Stack gap="md">
        <Text fw={600} size="lg">
          {resultado.escenario}
        </Text>

        <Grid>
          <Grid.Col span={6}>
            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Valores Originales
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Tarifa:</Text>
                  <Text>
                    ${resultado.valoresOriginales.tarifa.toLocaleString()}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Peajes:</Text>
                  <Text>
                    ${resultado.valoresOriginales.peaje.toLocaleString()}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Extras:</Text>
                  <Text>
                    ${resultado.valoresOriginales.extras.toLocaleString()}
                  </Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text fw={600}>Total:</Text>
                  <Text fw={600}>
                    ${resultado.valoresOriginales.total.toLocaleString()}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={6}>
            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Valores Finales
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Tarifa:</Text>
                  <Text
                    c={
                      resultado.diferencia.tarifa !== 0
                        ? resultado.diferencia.tarifa > 0
                          ? 'red'
                          : 'green'
                        : undefined
                    }
                  >
                    ${resultado.valoresFinales.tarifa.toLocaleString()}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Peajes:</Text>
                  <Text>
                    ${resultado.valoresFinales.peaje.toLocaleString()}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Extras:</Text>
                  <Text>
                    ${resultado.valoresFinales.extras.toLocaleString()}
                  </Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text fw={600}>Total:</Text>
                  <Text
                    fw={600}
                    c={
                      resultado.diferencia.total !== 0
                        ? resultado.diferencia.total > 0
                          ? 'red'
                          : 'green'
                        : undefined
                    }
                  >
                    ${resultado.valoresFinales.total.toLocaleString()}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {resultado.reglasAplicadas.length > 0 && (
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Reglas Aplicadas
            </Text>
            <Stack gap="xs">
              {resultado.reglasAplicadas.map((regla, index) => (
                <Group key={index} justify="space-between" p="sm" bg="gray.0">
                  <div>
                    <Text fw={600} size="sm">
                      {regla.nombre}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {regla.codigo}
                    </Text>
                  </div>
                  <Badge
                    color={
                      regla.modificacion > 0 ? 'red' : regla.modificacion < 0 ? 'green' : 'gray'
                    }
                    variant="light"
                  >
                    {regla.modificacion > 0 ? '+' : ''}${regla.modificacion.toLocaleString()}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Paper>
        )}

        <Paper p="md" withBorder>
          <Text fw={600} mb="sm">
            Resumen de Diferencias
          </Text>
          <Group justify="space-between">
            <Text>Diferencia Total:</Text>
            <Text
              fw={600}
              c={
                resultado.diferencia.total > 0
                  ? 'red'
                  : resultado.diferencia.total < 0
                    ? 'green'
                    : undefined
              }
            >
              {resultado.diferencia.total > 0 ? '+' : ''}$
              {resultado.diferencia.total.toLocaleString()}
              ({resultado.diferencia.porcentaje > 0 ? '+' : ''}
              {resultado.diferencia.porcentaje.toFixed(2)}%)
            </Text>
          </Group>
        </Paper>
      </Stack>
    </Modal>
  );
};

export default DetalleResultadoModal;