import React from 'react';
import { Stack, Alert, Card, Timeline, Group, Text, Badge, ActionIcon } from '@mantine/core';
import { IconX, IconAlertTriangle, IconTruck, IconUser, IconEye } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { DocumentoVencimiento, ExpirationConfig } from '../ExpirationManagerBase';
import {
  TIPOS_DOCUMENTO_LABELS,
  DATE_FORMAT_DISPLAY,
  ENTITY_TYPE_VEHICULO,
  getEstadoColor,
} from '../helpers/expirationHelpers';

interface ExpirationAlertsProps {
  documentosFiltrados: DocumentoVencimiento[];
  estadisticas: {
    vencidos: number;
    criticos: number;
    proximos: number;
    vigentes: number;
  };
  config: ExpirationConfig;
  onEditEntity?: (entidadId: string, entidadTipo: typeof ENTITY_TYPE_VEHICULO | 'personal') => void;
}

export const ExpirationAlerts: React.FC<ExpirationAlertsProps> = ({
  documentosFiltrados,
  estadisticas,
  config,
  onEditEntity,
}) => {
  const alertas = documentosFiltrados
    .filter(
      (doc) => doc.estado === 'vencido' || doc.estado === 'critico' || doc.estado === 'proximo'
    )
    .sort((a, b) => (a.diasRestantes || 0) - (b.diasRestantes || 0));

  const getEntidadIcon = (tipo: typeof ENTITY_TYPE_VEHICULO | 'personal') => {
    return tipo === ENTITY_TYPE_VEHICULO ? <IconTruck size={16} /> : <IconUser size={16} />;
  };

  return (
    <Stack gap="md">
      {/* Alertas críticas */}
      {estadisticas.vencidos > 0 && (
        <Alert icon={<IconX size={16} />} color="red" title="Documentos Vencidos">
          <Text size="sm">
            {estadisticas.vencidos} documento{estadisticas.vencidos > 1 ? 's' : ''} vencido
            {estadisticas.vencidos > 1 ? 's' : ''} que requieren atención inmediata
          </Text>
        </Alert>
      )}

      {estadisticas.criticos > 0 && (
        <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Documentos Críticos">
          <Text size="sm">
            {estadisticas.criticos} documento{estadisticas.criticos > 1 ? 's' : ''} vence
            {estadisticas.criticos > 1 ? 'n' : ''} en {config.diasCritico} días o menos
          </Text>
        </Alert>
      )}

      {/* Lista de documentos con alertas */}
      <Card withBorder>
        <Timeline active={-1} bulletSize={20}>
          {alertas.slice(0, 10).map((doc) => (
            <Timeline.Item
              key={doc._id}
              bullet={getEntidadIcon(doc.entidadTipo)}
              color={getEstadoColor(doc.estado, config)}
            >
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Text fw={500} size="sm">
                    {doc.entidadNombre}
                  </Text>
                  <Badge size="xs" variant="light">
                    {TIPOS_DOCUMENTO_LABELS[doc.tipo] || doc.tipo}
                  </Badge>
                </Group>

                <Group gap="xs">
                  <Badge color={getEstadoColor(doc.estado, config)} variant="light" size="xs">
                    {doc.estado === 'vencido'
                      ? `Vencido hace ${Math.abs(doc.diasRestantes || 0)} días`
                      : `${doc.diasRestantes} días restantes`}
                  </Badge>

                  {onEditEntity && (
                    <ActionIcon
                      size="xs"
                      variant="light"
                      color="blue"
                      onClick={() => onEditEntity(doc.entidadId, doc.entidadTipo)}
                    >
                      <IconEye size={12} />
                    </ActionIcon>
                  )}
                </Group>
              </Group>

              <Text size="xs" c="dimmed">
                Vence: {dayjs(doc.fechaVencimiento).format(DATE_FORMAT_DISPLAY)}
              </Text>

              {doc.numero && (
                <Text size="xs" c="dimmed">
                  Número: {doc.numero}
                </Text>
              )}
            </Timeline.Item>
          ))}
        </Timeline>

        {alertas.length > 10 && (
          <Text size="xs" c="dimmed" ta="center" mt="md">
            Y {alertas.length - 10} documento{alertas.length - 10 > 1 ? 's' : ''} más...
          </Text>
        )}
      </Card>
    </Stack>
  );
};
