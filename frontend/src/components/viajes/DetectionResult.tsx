import React from 'react';
import { Stack, Group, Card, Text, Badge, Alert, Divider, Progress } from '@mantine/core';
import { IconCheck, IconBulb } from '@tabler/icons-react';
import { VehicleDetectionResult } from './VehicleTypeDetector';
import { getConfidenceColor, getTipoLabel } from './detectionUtils';

interface DetectionResultProps {
  result: VehicleDetectionResult;
}

export const DetectionResult: React.FC<DetectionResultProps> = ({ result }) => {
  return (
    <Card withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text fw={600} size="lg">
              {getTipoLabel(result.tipoUnidad)}
            </Text>
            <Text size="sm" c="dimmed">
              Tipo de unidad detectado
            </Text>
          </div>

          <Group>
            <Progress
              value={result.confidence}
              color={getConfidenceColor(result.confidence)}
              size="xl"
              radius="xl"
              w={80}
            />
            <div style={{ textAlign: 'center' }}>
              <Text fw={600} size="sm">
                {result.confidence.toFixed(0)}%
              </Text>
              <Text size="xs" c="dimmed">
                Confianza
              </Text>
            </div>
          </Group>
        </Group>

        <Divider />

        {/* Razones de la detección */}
        <div>
          <Text fw={500} mb="xs">
            Fundamentos del Análisis:
          </Text>
          <Stack gap="xs">
            {result.reasons.map((reason, index) => (
              <Group key={index} gap="xs">
                <IconCheck size={14} color="green" />
                <Text size="sm">{reason}</Text>
              </Group>
            ))}
          </Stack>
        </div>

        {/* Recomendaciones */}
        {result.recommendations.length > 0 && (
          <Alert icon={<IconBulb size={16} />} color="blue" variant="light">
            <Text fw={500} mb="xs">
              Recomendaciones:
            </Text>
            {result.recommendations.map((rec, index) => (
              <Text key={index} size="sm">
                {rec}
              </Text>
            ))}
          </Alert>
        )}

        {/* Tipos alternativos */}
        {result.alternativeTypes.length > 0 && (
          <div>
            <Text fw={500} mb="xs">
              Alternativas Consideradas:
            </Text>
            <Stack gap="xs">
              {result.alternativeTypes.map((alt, index) => (
                <Group key={index} justify="space-between">
                  <Text size="sm">{getTipoLabel(alt.tipo)}</Text>
                  <Group gap="xs">
                    <Badge color="gray" variant="light" size="sm">
                      {alt.confidence.toFixed(0)}%
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {alt.reason}
                    </Text>
                  </Group>
                </Group>
              ))}
            </Stack>
          </div>
        )}
      </Stack>
    </Card>
  );
};
