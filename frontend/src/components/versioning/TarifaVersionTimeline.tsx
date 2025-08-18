import React from 'react';
import { Timeline, Card, Title, Group, Text, Badge, ActionIcon, Switch } from '@mantine/core';
import { IconEdit, IconEye, IconCheck, IconClock } from '@tabler/icons-react';
import { TarifaVersion } from '../../services/tarifaService';

interface TarifaVersionTimelineProps {
  versions: TarifaVersion[];
  onVersionSelect?: (version: TarifaVersion) => void;
  onEditVersion: (version: TarifaVersion) => void;
  onToggleVersion: (versionId: string, activa: boolean) => void;
  formatDate: (dateString: string) => string;
  getVersionStatus: (version: TarifaVersion) => { color: string; label: string };
}

export const TarifaVersionTimeline: React.FC<TarifaVersionTimelineProps> = ({
  versions,
  onVersionSelect,
  onEditVersion,
  onToggleVersion,
  formatDate,
  getVersionStatus,
}) => {
  return (
    <Card withBorder mb="md">
      <Title order={5} mb="md">
        Línea de Tiempo
      </Title>
      <Timeline active={versions.findIndex((v) => getVersionStatus(v).label === 'Vigente')}>
        {versions
          .sort(
            (a, b) =>
              new Date(b.fechaVigenciaInicio).getTime() - new Date(a.fechaVigenciaInicio).getTime()
          )
          .map((version) => {
            const status = getVersionStatus(version);
            return (
              <Timeline.Item
                key={version._id}
                bullet={
                  status.label === 'Vigente' ? <IconCheck size={12} /> : <IconClock size={12} />
                }
                color={status.color}
              >
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>Versión {version.version}</Text>
                    <Text size="sm" c="dimmed">
                      Desde {formatDate(version.fechaVigenciaInicio)}
                      {version.fechaVigenciaFin && ` hasta ${formatDate(version.fechaVigenciaFin)}`}
                    </Text>
                    <Badge size="sm" color={status.color} mt="xs">
                      {status.label}
                    </Badge>
                  </div>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => onVersionSelect?.(version)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="orange"
                      onClick={() => onEditVersion(version)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <Switch
                      checked={version.activa}
                      onChange={(event) =>
                        onToggleVersion(version._id, event.currentTarget.checked)
                      }
                      size="sm"
                    />
                  </Group>
                </Group>
              </Timeline.Item>
            );
          })}
      </Timeline>
    </Card>
  );
};
