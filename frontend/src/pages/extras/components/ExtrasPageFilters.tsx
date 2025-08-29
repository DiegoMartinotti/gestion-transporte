import React from 'react';
import { Group, Select, Box } from '@mantine/core';
import SearchInput from '../../../components/base/SearchInput';
import { ClienteSelector } from '../../../components/selectors/ClienteSelector';
import { TIPOS_EXTRA } from '../helpers/extrasHelpers';

interface ExtrasPageFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCliente: string;
  onClienteChange: (value: string) => void;
  selectedTipo: string;
  onTipoChange: (value: string) => void;
}

export const ExtrasPageFilters = ({
  searchTerm,
  onSearchChange,
  selectedCliente,
  onClienteChange,
  selectedTipo,
  onTipoChange,
}: ExtrasPageFiltersProps) => {
  const tipoOptions = [
    { value: '', label: 'Todos los tipos' },
    ...TIPOS_EXTRA.map((tipo) => ({
      value: tipo,
      label: tipo.replace('_', ' '),
    })),
  ];

  return (
    <Group grow>
      <Box>
        <SearchInput
          placeholder="Buscar extras..."
          value={searchTerm}
          onChange={onSearchChange}
        />
      </Box>
      <Box>
        <ClienteSelector
          value={selectedCliente}
          onChange={onClienteChange}
          placeholder="Todos los clientes"
          clearable
        />
      </Box>
      <Box>
        <Select
          placeholder="Todos los tipos"
          data={tipoOptions}
          value={selectedTipo}
          onChange={(value) => onTipoChange(value || '')}
          clearable
        />
      </Box>
    </Group>
  );
};