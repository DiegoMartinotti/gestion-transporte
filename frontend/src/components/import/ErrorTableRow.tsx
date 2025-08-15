import React, { useState } from 'react';
import { ImportError, CorrectionAction } from '../../hooks/useErrorCorrections';
import { ErrorTableRowEdit } from './ErrorTableRowEdit';
import { ErrorTableRowActions } from './ErrorTableRowActions';
import { ErrorTableRowContent } from './ErrorTableRowContent';

interface ErrorTableRowProps {
  error: ImportError;
  index: number;
  selectedErrors: Set<string>;
  corrections: CorrectionAction[];
  onToggleSelection: (errorKey: string, checked: boolean) => void;
  onEdit: (row: number, field: string, newValue: unknown) => void;
  onApplySuggestion: (error: ImportError) => void;
  onSkipRow: (row: number) => void;
  onDeleteRow: (row: number) => void;
}

export const ErrorTableRow: React.FC<ErrorTableRowProps> = ({
  error,
  index,
  selectedErrors,
  corrections,
  onToggleSelection,
  onEdit,
  onApplySuggestion,
  onSkipRow,
  onDeleteRow,
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const errorKey = `${error.row}-${error.field}`;
  const isEditing = editingCell?.row === error.row && editingCell?.field === error.field;
  const correction = corrections.find((c) => c.row === error.row && c.field === error.field);

  const handleEditStart = () => {
    setEditingCell({ row: error.row, field: error.field });
    setEditValue(String(error.value));
  };

  const handleEditConfirm = () => {
    onEdit(error.row, error.field, editValue);
    setEditingCell(null);
  };

  const handleEditCancel = () => {
    setEditingCell(null);
  };

  if (isEditing) {
    return (
      <tr key={index}>
        <ErrorTableRowContent
          error={error}
          errorKey={errorKey}
          selectedErrors={selectedErrors}
          correction={correction}
          onToggleSelection={onToggleSelection}
        />
        <td>
          <ErrorTableRowEdit
            editValue={editValue}
            setEditValue={setEditValue}
            onConfirm={handleEditConfirm}
            onCancel={handleEditCancel}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr key={index}>
      <ErrorTableRowContent
        error={error}
        errorKey={errorKey}
        selectedErrors={selectedErrors}
        correction={correction}
        onToggleSelection={onToggleSelection}
      />
      <td>
        <ErrorTableRowActions
          error={error}
          isEditing={isEditing}
          onEdit={handleEditStart}
          onApplySuggestion={onApplySuggestion}
          onSkipRow={onSkipRow}
          onDeleteRow={onDeleteRow}
        />
      </td>
    </tr>
  );
};
