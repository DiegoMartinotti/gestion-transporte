import React, { useState } from 'react';
import { Paper, Table, ScrollArea, Checkbox } from '@mantine/core';
import { ImportError, CorrectionAction } from '../../hooks/useErrorCorrections';
import { ErrorTableRow } from './ErrorTableRow';

interface ErrorTableProps {
  filteredErrors: ImportError[];
  corrections: CorrectionAction[];
  onEdit: (row: number, field: string, newValue: unknown) => void;
  onApplySuggestion: (error: ImportError) => void;
  onSkipRow: (row: number) => void;
  onDeleteRow: (row: number) => void;
}

export const ErrorTable: React.FC<ErrorTableProps> = ({
  filteredErrors,
  corrections,
  onEdit,
  onApplySuggestion,
  onSkipRow,
  onDeleteRow,
}) => {
  const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedErrors(new Set(filteredErrors.map((e) => `${e.row}-${e.field}`)));
    } else {
      setSelectedErrors(new Set());
    }
  };

  const handleToggleSelection = (errorKey: string, checked: boolean) => {
    const newSelected = new Set(selectedErrors);
    if (checked) {
      newSelected.add(errorKey);
    } else {
      newSelected.delete(errorKey);
    }
    setSelectedErrors(newSelected);
  };

  const isAllSelected = selectedErrors.size === filteredErrors.length && filteredErrors.length > 0;

  return (
    <Paper p="md" withBorder>
      <ScrollArea style={{ height: 400 }}>
        <Table highlightOnHover>
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <Checkbox
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                />
              </th>
              <th>Fila</th>
              <th>Campo</th>
              <th>Valor actual</th>
              <th>Error</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredErrors.map((error, index) => (
              <ErrorTableRow
                key={`${error.row}-${error.field}-${index}`}
                error={error}
                index={index}
                selectedErrors={selectedErrors}
                corrections={corrections}
                onToggleSelection={handleToggleSelection}
                onEdit={onEdit}
                onApplySuggestion={onApplySuggestion}
                onSkipRow={onSkipRow}
                onDeleteRow={onDeleteRow}
              />
            ))}
          </tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
};
