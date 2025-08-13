import React from 'react';
import { Timeline, Text, Badge, Group, ActionIcon, Switch, Card, Title } from '@mantine/core';
import { IconCheck, IconClock, IconEye, IconEdit } from '@tabler/icons-react';
import {
  TarifaVersion,
  formatDate,
  getVersionStatus,
  getActiveVersionIndex,
  sortVersionsByDate,
} from './helpers/tarifaVersioningHelpers';

interface VersionTimelineProps {
  versions: TarifaVersion[];
  onVersionSelect?: (version: TarifaVersion) => void;
  onEditVersion: (version: TarifaVersion) => void;
  onToggleActive: (versionId: string, activa: boolean) => void;
}

const VersionTimeline: React.FC<VersionTimelineProps> = ({
  versions,
  onVersionSelect,
  onEditVersion,
  onToggleActive,
}) => {
  const sortedVersions = sortVersionsByDate(versions);
  const activeIndex = getActiveVersionIndex(sortedVersions);

  return (
    <Card withBorder mb="md">
      <Title order={5} mb="md">
        Línea de Tiempo
      </Title>
      <Timeline active={activeIndex}>
        {sortedVersions.map((version) => {
          const status = getVersionStatus(version);
          const isActive = status.label === 'Vigente';

          return (
            <Timeline.Item
              key={version._id}
              bullet={isActive ? <IconCheck size={12} /> : <IconClock size={12} />}
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
                  <ActionIcon variant="light" color="orange" onClick={() => onEditVersion(version)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <Switch
                    checked={version.activa}
                    onChange={(event) => onToggleActive(version._id, event.currentTarget.checked)}
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

export default VersionTimeline;
