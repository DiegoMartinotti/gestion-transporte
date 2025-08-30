import React from 'react';
import { Stack, Group, Text, Title, Card, Badge } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar, IconTruck, IconUser } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { DocumentoVencimiento, ExpirationConfig } from '../ExpirationManagerBase';
import {
  TIPOS_DOCUMENTO_LABELS,
  DATE_FORMAT_DISPLAY,
  DATE_FORMAT_ISO,
  ENTITY_TYPE_VEHICULO,
  getEstadoColor,
} from '../helpers/expirationHelpers';

interface ExpirationCalendarProps {
  selectedDate: Date | null;
  onSelectedDateChange: (date: Date | null) => void;
  documentosPorFecha: Record<string, DocumentoVencimiento[]>;
  config: ExpirationConfig;
}

export const ExpirationCalendar: React.FC<ExpirationCalendarProps> = ({
  selectedDate,
  onSelectedDateChange,
  documentosPorFecha,
  config,
}) => {
  const getEntidadIcon = (tipo: typeof ENTITY_TYPE_VEHICULO | 'personal') => {
    return tipo === ENTITY_TYPE_VEHICULO ? <IconTruck size={16} /> : <IconUser size={16} />;
  };

  return (
    <Stack gap="md">
      <DatePickerInput
        label="Seleccionar fecha"
        value={selectedDate}
        onChange={(value) => onSelectedDateChange(value ? new Date(value) : null)}
        leftSection={<IconCalendar size={16} />}
      />

      {selectedDate && documentosPorFecha[dayjs(selectedDate).format(DATE_FORMAT_ISO)] && (
        <Card withBorder mt="md">
          <Title order={6} mb="sm">
            Vencimientos del {dayjs(selectedDate).format(DATE_FORMAT_DISPLAY)}
          </Title>
          <Stack gap="xs">
            {documentosPorFecha[dayjs(selectedDate).format(DATE_FORMAT_ISO)].map((doc) => (
              <Group key={doc._id} justify="space-between">
                <Group gap="xs">
                  {getEntidadIcon(doc.entidadTipo)}
                  <Text size="sm">{doc.entidadNombre}</Text>
                  <Badge size="xs" variant="light">
                    {TIPOS_DOCUMENTO_LABELS[doc.tipo] || doc.tipo}
                  </Badge>
                </Group>
                <Badge color={getEstadoColor(doc.estado, config)} size="xs">
                  {doc.estado?.toUpperCase()}
                </Badge>
              </Group>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
};
