import React from 'react';
import { Group, Title, Text, Button } from '@mantine/core';
import { IconPlus, IconFileExport, IconFileImport } from '@tabler/icons-react';
import type { PersonalFilters } from '../../types';

interface ExcelOperations {
  handleExport: (filters: unknown) => void;
  isExporting: boolean;
}

interface ImportModal {
  openCreate: () => void;
}

interface PersonalPageHeaderProps {
  totalItems: number;
  filters: Omit<PersonalFilters, 'page' | 'limit'>;
  importModal: ImportModal;
  excelOperations: ExcelOperations;
  onCreatePersonal: () => void;
}

export const PersonalPageHeader: React.FC<PersonalPageHeaderProps> = ({
  totalItems,
  filters,
  importModal,
  excelOperations,
  onCreatePersonal,
}) => {
  return (
    <Group justify="space-between">
      <div>
        <Title order={2}>Gestión de Personal</Title>
        <Text size="sm" c="dimmed">
          {totalItems} empleado{totalItems !== 1 ? 's' : ''} registrado
          {totalItems !== 1 ? 's' : ''}
        </Text>
      </div>
      <Group>
        <Button
          leftSection={<IconFileImport size={16} />}
          variant="outline"
          onClick={importModal.openCreate}
        >
          Importar
        </Button>
        <Button
          leftSection={<IconFileExport size={16} />}
          variant="outline"
          onClick={() => excelOperations.handleExport(filters)}
          loading={excelOperations.isExporting}
        >
          Exportar
        </Button>
        <Button leftSection={<IconPlus size={16} />} onClick={onCreatePersonal}>
          Nuevo Personal
        </Button>
      </Group>
    </Group>
  );
};
