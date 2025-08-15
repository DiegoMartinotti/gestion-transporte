import React from 'react';
import { Stack, Group, Badge, Button, Card, Title } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

import { useErrorCorrections, ImportError, CorrectedData } from '../../hooks/useErrorCorrections';
import { useErrorFilters } from '../../hooks/useErrorFilters';
import { useErrorStats } from '../../hooks/useErrorStats';
import { ErrorStatsCards } from './ErrorStatsCards';
import { ErrorFilters } from './ErrorFilters';
import { ErrorTable } from './ErrorTable';

interface ErrorCorrectionProps {
  errors: ImportError[];
  data: CorrectedData[];
  onCorrect: (correctedData: CorrectedData[]) => void;
  onSkip?: (skippedRows: number[]) => void;
  entityType?: string;
}

export const ErrorCorrection: React.FC<ErrorCorrectionProps> = ({
  errors,
  data,
  onCorrect,
  onSkip,
}) => {
  const {
    corrections,
    handleEdit,
    handleSkipRow,
    handleDeleteRow,
    applySuggestion,
    bulkFixCommonErrors,
    applyCorrections: performCorrections,
  } = useErrorCorrections(errors, data);

  const { searchTerm, setSearchTerm, filterSeverity, setFilterSeverity, filteredErrors } =
    useErrorFilters(errors);

  const stats = useErrorStats(errors, corrections);

  const handleApplyCorrections = () => {
    const { finalData, skippedRows } = performCorrections();
    onCorrect(finalData);
    if (onSkip) {
      onSkip(skippedRows);
    }
  };

  return (
    <Stack gap="md">
      <Card withBorder>
        <Group justify="space-between">
          <Title order={3}>Corrección de errores</Title>
          <Badge size="lg" color={stats.pendingErrors > 0 ? 'red' : 'green'}>
            {stats.pendingErrors} errores pendientes
          </Badge>
        </Group>
      </Card>

      <ErrorStatsCards stats={stats} />

      <ErrorFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterSeverity={filterSeverity}
        setFilterSeverity={setFilterSeverity}
        onBulkFix={bulkFixCommonErrors}
      />

      <ErrorTable
        filteredErrors={filteredErrors}
        corrections={corrections}
        onEdit={handleEdit}
        onApplySuggestion={applySuggestion}
        onSkipRow={handleSkipRow}
        onDeleteRow={handleDeleteRow}
      />

      <Group justify="flex-end">
        <Button variant="default" onClick={() => onCorrect(data)}>
          Omitir correcciones
        </Button>

        <Button
          leftSection={<IconCheck size={16} />}
          onClick={handleApplyCorrections}
          disabled={stats.pendingErrors > 0}
        >
          Aplicar correcciones ({stats.correctedErrors})
        </Button>
      </Group>
    </Stack>
  );
};
