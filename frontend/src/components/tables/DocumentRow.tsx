import React from 'react';
import { Group, Text, Badge, ActionIcon, Tooltip } from '@mantine/core';
import {
  IconLicense,
  IconStethoscope,
  IconCalendarEvent,
  IconEye,
  IconEdit,
} from '@tabler/icons-react';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import {
  formatDocumentDate,
  getDaysUntilText,
  type DocumentoInfo,
} from './helpers/documentacionHelpers';
import type { Personal } from '../../types';

interface DocumentRowProps {
  doc: DocumentoInfo;
  index: number;
  onViewPersonal?: (personal: Personal) => void;
  onEditPersonal?: (personal: Personal) => void;
  findPersonalById: (id: string) => Personal | undefined;
}

const getTipoIcon = (tipoDocumento: string) => {
  switch (tipoDocumento) {
    case 'Licencia de Conducir':
    case 'Carnet Profesional':
      return <IconLicense size={16} />;
    case 'Evaluación Médica':
    case 'Psicofísico':
      return <IconStethoscope size={16} />;
    default:
      return <IconCalendarEvent size={16} />;
  }
};

export const DocumentRow: React.FC<DocumentRowProps> = ({
  doc,
  index,
  onViewPersonal,
  onEditPersonal,
  findPersonalById,
}) => {
  const handleViewPersonal = () => {
    if (onViewPersonal) {
      const person = findPersonalById(doc.personalId);
      if (person) onViewPersonal(person);
    }
  };

  const handleEditPersonal = () => {
    if (onEditPersonal) {
      const person = findPersonalById(doc.personalId);
      if (person) onEditPersonal(person);
    }
  };

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
        <Text size="sm">{formatDocumentDate(doc.fechaVencimiento)}</Text>
      </td>
      <td>
        <DocumentStatusBadge status={doc.status} />
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
              <ActionIcon size="sm" onClick={handleViewPersonal}>
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {onEditPersonal && (
            <Tooltip label="Editar personal">
              <ActionIcon size="sm" color="blue" onClick={handleEditPersonal}>
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </td>
    </tr>
  );
};
