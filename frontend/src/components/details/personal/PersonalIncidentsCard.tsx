import React from 'react';
import { Title, Badge, Card, Table } from '@mantine/core';
import { IconExclamationMark } from '@tabler/icons-react';
import type { PersonalCardProps } from './PersonalDetailTypes';
import { getIncidentColor, formatDate } from './PersonalDetailHelpers';

export const PersonalIncidentsCard: React.FC<PersonalCardProps> = ({ personal }) => {
  if (!personal.incidentes || personal.incidentes.length === 0) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconExclamationMark size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Incidentes
      </Title>
      <Table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Consecuencias</th>
          </tr>
        </thead>
        <tbody>
          {personal.incidentes.map((incidente, index) => (
            <tr key={index}>
              <td>{formatDate(incidente.fecha)}</td>
              <td>
                <Badge color={getIncidentColor(incidente.tipo || 'otro')} variant="light" size="sm">
                  {incidente.tipo}
                </Badge>
              </td>
              <td>{incidente.descripcion}</td>
              <td>{incidente.consecuencias || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
};
