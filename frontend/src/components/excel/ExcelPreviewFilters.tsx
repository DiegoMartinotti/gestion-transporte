import React from 'react';
import { Group, TextInput, Badge, ActionIcon, Menu, Checkbox } from '@mantine/core';
import { IconSearch, IconColumns } from '@tabler/icons-react';
import { ColumnConfig } from './ExcelDataPreview';

interface ExcelPreviewFiltersProps {
  allowFiltering: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRows: number[];
  allowColumnToggle: boolean;
  columns: ColumnConfig[];
  columnVisibility: Record<string, boolean>;
  handleColumnVisibility: (columnKey: string) => void;
}

export const ExcelPreviewFilters: React.FC<ExcelPreviewFiltersProps> = ({
  allowFiltering,
  searchQuery,
  setSearchQuery,
  selectedRows,
  allowColumnToggle,
  columns,
  columnVisibility,
  handleColumnVisibility,
}) => {
  const renderSearchInput = () => {
    if (!allowFiltering) return null;

    return (
      <TextInput
        placeholder="Buscar en todos los campos..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ minWidth: 250 }}
      />
    );
  };

  const renderSelectedRowsBadge = () => {
    if (selectedRows.length === 0) return null;

    return (
      <Badge variant="light" color="blue">
        {selectedRows.length} seleccionadas
      </Badge>
    );
  };

  const renderColumnToggleMenu = () => {
    if (!allowColumnToggle) return null;

    return (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon variant="light">
            <IconColumns size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Columnas visibles</Menu.Label>
          {columns.map((column) => (
            <Menu.Item
              key={column.key}
              leftSection={
                <Checkbox
                  checked={columnVisibility[column.key]}
                  onChange={() => handleColumnVisibility(column.key)}
                />
              }
              onClick={() => handleColumnVisibility(column.key)}
            >
              {column.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    );
  };

  return (
    <Group justify="space-between">
      <Group gap="sm">
        {renderSearchInput()}
        {renderSelectedRowsBadge()}
      </Group>
      {renderColumnToggleMenu()}
    </Group>
  );
};

export default ExcelPreviewFilters;
