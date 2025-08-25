import React from 'react';
import { Title, Text, Badge, Group, Card, Timeline, ThemeIcon } from '@mantine/core';
import { IconBuilding, IconClock } from '@tabler/icons-react';
import type { PersonalCardProps } from './PersonalDetailTypes';
import { formatDate } from './PersonalDetailHelpers';

export const PersonalEmploymentCard: React.FC<PersonalCardProps> = ({ personal }) => {
  if (!personal.periodosEmpleo || personal.periodosEmpleo.length === 0) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconBuilding size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Historial de Empleo
      </Title>
      <Timeline bulletSize={24} lineWidth={2}>
        {personal.periodosEmpleo.map((periodo, index) => (
          <Timeline.Item
            key={index}
            bullet={
              <ThemeIcon size={24} variant="filled" color={!periodo.fechaEgreso ? 'green' : 'blue'}>
                <IconClock size={12} />
              </ThemeIcon>
            }
            title={
              <Group>
                <Text size="sm" fw={500}>
                  {periodo.categoria || 'Sin categoría especificada'}
                </Text>
                {!periodo.fechaEgreso && (
                  <Badge size="xs" color="green">
                    Actual
                  </Badge>
                )}
              </Group>
            }
          >
            <Text size="xs" c="dimmed" mb="xs">
              {formatDate(periodo.fechaIngreso)} -{' '}
              {periodo.fechaEgreso ? formatDate(periodo.fechaEgreso) : 'Actualidad'}
            </Text>
            {periodo.motivo && (
              <Text size="xs" c="dimmed">
                Motivo: {periodo.motivo}
              </Text>
            )}
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};
