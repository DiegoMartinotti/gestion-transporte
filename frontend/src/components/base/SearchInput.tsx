import { TextInput, ActionIcon, Loader } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useDebouncedValue } from '@mantine/hooks';

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  width?: string | number;
}

export default function SearchInput({
  value = '',
  onChange,
  placeholder = 'Buscar...',
  debounceMs = 300,
  loading = false,
  disabled = false,
  size = 'sm',
  width = 300,
}: SearchInputProps) {
  const [searchValue, setSearchValue] = useState(value);
  const [debouncedSearch] = useDebouncedValue(searchValue, debounceMs);

  useEffect(() => {
    if (debouncedSearch !== value) {
      onChange(debouncedSearch);
    }
  }, [debouncedSearch, onChange, value]);

  useEffect(() => {
    if (value !== searchValue) {
      setSearchValue(value);
    }
  }, [value, searchValue]);

  const handleClear = () => {
    setSearchValue('');
    onChange('');
  };

  const getRightSection = () => {
    if (loading) {
      return <Loader size="xs" />;
    }

    if (searchValue.length > 0) {
      return (
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
        >
          <IconX size="0.9rem" />
        </ActionIcon>
      );
    }

    return null;
  };

  return (
    <TextInput
      value={searchValue}
      onChange={(e) => setSearchValue(e.currentTarget.value)}
      placeholder={placeholder}
      leftSection={<IconSearch size="1rem" />}
      rightSection={getRightSection()}
      disabled={disabled}
      size={size}
      style={{ width }}
    />
  );
}
