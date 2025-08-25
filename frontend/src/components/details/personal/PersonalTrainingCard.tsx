import React from 'react';
import { Title, Badge, Card, Table } from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import type { PersonalCardProps } from './PersonalDetailTypes';
import { getDocumentStatus, formatDate } from './PersonalDetailHelpers';

export const PersonalTrainingCard: React.FC<PersonalCardProps> = ({ personal }) => {
  if (!personal.capacitaciones || personal.capacitaciones.length === 0) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconSchool size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Capacitaciones
      </Title>
      <Table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha</th>
            <th>Vencimiento</th>
            <th>Institución</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {personal.capacitaciones.map((capacitacion, index) => {
            const status = getDocumentStatus(capacitacion.vencimiento);
            return (
              <tr key={index}>
                <td>{capacitacion.nombre}</td>
                <td>{formatDate(capacitacion.fecha)}</td>
                <td>{formatDate(capacitacion.vencimiento)}</td>
                <td>{capacitacion.institucion || '-'}</td>
                <td>
                  {status && (
                    <Badge color={status.color} variant="light" size="sm">
                      {status.status === 'expired'
                        ? 'Vencida'
                        : status.status === 'expiring'
                          ? 'Por Vencer'
                          : 'Vigente'}
                    </Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
};
