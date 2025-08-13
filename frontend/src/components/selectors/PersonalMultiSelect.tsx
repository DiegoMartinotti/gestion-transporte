import React from 'react';
import { MultiSelect } from '@mantine/core';

interface PersonalMultiSelectProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
  error?: string;
  disabled?: boolean;
  data: unknown[];
  value: string[] | null;
  onChange: (value: string[] | null) => void;
}

export const PersonalMultiSelect: React.FC<PersonalMultiSelectProps> = ({
  label,
  placeholder,
  required,
  clearable,
  error,
  disabled,
  data,
  value,
  onChange,
}) => {
  return (
    <MultiSelect
      label={label}
      placeholder={placeholder}
      required={required}
      clearable={clearable}
      error={error}
      disabled={disabled}
      searchable={true}
      // itemComponent={PersonalSelectItem} // Comentado temporalmente por compatibilidad
      data={data}
      value={Array.isArray(value) ? value : value ? [value] : []}
      onChange={onChange}
    />
  );
};
