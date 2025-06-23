import { DateInput } from '@mantine/dates';
import { Group, Text } from '@mantine/core';

interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  clearable?: boolean;
  maxDate?: Date;
  minDate?: Date;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label,
  placeholder = 'Seleccionar rango de fechas',
  required = false,
  disabled = false,
  size = 'sm',
  clearable = true,
  maxDate,
  minDate
}: DateRangePickerProps) {
  return (
    <Group gap="xs" align="flex-end">
      {label && (
        <Text size="sm" fw={500}>
          {label}
          {required && <span style={{ color: 'var(--mantine-color-red-6)' }}> *</span>}
        </Text>
      )}
      
      <DateInput
        value={startDate}
        onChange={(value) => onStartDateChange(value ? new Date(value) : null)}
        placeholder="Fecha desde"
        valueFormat="DD/MM/YYYY"
        size={size}
        disabled={disabled}
        clearable={clearable}
        maxDate={endDate || maxDate}
        minDate={minDate}
      />
      
      <Text size={size} c="dimmed">
        -
      </Text>
      
      <DateInput
        value={endDate}
        onChange={(value) => onEndDateChange(value ? new Date(value) : null)}
        placeholder="Fecha hasta"
        valueFormat="DD/MM/YYYY"
        size={size}
        disabled={disabled}
        clearable={clearable}
        maxDate={maxDate}
        minDate={startDate || minDate}
      />
    </Group>
  );
}