import { Group, Select } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import SearchInput from '../base/SearchInput';
import { ClienteSelector } from '../selectors/ClienteSelector';

interface ExtrasFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCliente: string;
  setSelectedCliente: (value: string) => void;
  selectedTipo: string;
  setSelectedTipo: (value: string) => void;
  tiposExtra: string[];
}

export function ExtrasFilters({
  searchTerm,
  setSearchTerm,
  selectedCliente,
  setSelectedCliente,
  selectedTipo,
  setSelectedTipo,
  tiposExtra,
}: ExtrasFiltersProps) {
  return (
    <Group>
      <SearchInput
        placeholder="Buscar por tipo o descripción..."
        value={searchTerm}
        onChange={setSearchTerm}
      />
      <ClienteSelector
        value={selectedCliente}
        onChange={(value) => setSelectedCliente(value || '')}
        placeholder="Todos los clientes"
        clearable
      />
      <Select
        placeholder="Tipo de extra"
        value={selectedTipo}
        onChange={(value) => setSelectedTipo(value || '')}
        data={tiposExtra}
        clearable
        leftSection={<IconFilter size={16} />}
      />
    </Group>
  );
}
