import { DatePickerInput } from '@mantine/dates';

interface DateRangePickerProps {
  value: [string | null, string | null];
  onChange: (value: [string | null, string | null]) => void;
  placeholder?: string;
  clearable?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Selecciona rango de fechas',
  clearable = true,
}: DateRangePickerProps) {
  return (
    <DatePickerInput
      type="range"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      clearable={clearable}
    />
  );
}
