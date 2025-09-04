import React from 'react';
import { Badge, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconEye, IconEdit } from '@tabler/icons-react';
import type { Personal } from '../../../types';
import type { DocumentoInfo } from './hooks/useDocumentosData';
import { getStatusColor, getStatusLabel, getTipoIcon, formatDate, getDaysUntilText } from './utils';

interface DocumentRowProps {
  doc: DocumentoInfo;
  index: number;
  onViewPersonal?: (personal: Personal) => void;
  onEditPersonal?: (personal: Personal) => void;
  findPersonalById: (id: string) => Personal | undefined;
}

export const DocumentRow: React.FC<DocumentRowProps> = ({
  doc,
  index,
  onViewPersonal,
  onEditPersonal,
  findPersonalById,
}) => {
  return (
    <tr key={`${doc.personalId}-${doc.tipoDocumento}-${index}`}>
      <td>
        <div>
          <Text size="sm" fw={500}>
            {doc.personalNombre}
          </Text>
          <Text size="xs" color="dimmed">
            DNI: {doc.dni}
          </Text>
        </div>
      </td>
      <td>
        <Badge size="sm" variant="light" color="blue">
          {doc.empresa}
        </Badge>
      </td>
      <td>
        <Group gap="xs">
          {getTipoIcon(doc.tipoDocumento)}
          <div>
            <Text size="sm">{doc.tipoDocumento}</Text>
            {doc.categoria && (
              <Text size="xs" color="dimmed">
                Categoría: {doc.categoria}
              </Text>
            )}
            {doc.resultado && (
              <Text size="xs" color="dimmed">
                Resultado: {doc.resultado}
              </Text>
            )}
          </div>
        </Group>
      </td>
      <td>
        <Text size="sm">{doc.numero || '-'}</Text>
      </td>
      <td>
        <Text size="sm">{formatDate(doc.fechaVencimiento)}</Text>
      </td>
      <td>
        <Badge color={getStatusColor(doc.status)} variant="light" size="sm">
          {getStatusLabel(doc.status)}
        </Badge>
      </td>
      <td>
        <Text
          size="xs"
          color={doc.status === 'expired' ? 'red' : doc.status === 'expiring' ? 'orange' : 'dimmed'}
        >
          {getDaysUntilText(doc.daysUntilExpiry, doc.status)}
        </Text>
      </td>
      <td>
        <Group gap="xs">
          {onViewPersonal && (
            <Tooltip label="Ver personal">
              <ActionIcon
                size="sm"
                onClick={() => {
                  const person = findPersonalById(doc.personalId);
                  if (person) onViewPersonal(person);
                }}
              >
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {onEditPersonal && (
            <Tooltip label="Editar personal">
              <ActionIcon
                size="sm"
                color="blue"
                onClick={() => {
                  const person = findPersonalById(doc.personalId);
                  if (person) onEditPersonal(person);
                }}
              >
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </td>
    </tr>
  );
};
