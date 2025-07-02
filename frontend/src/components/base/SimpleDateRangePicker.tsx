import { DatePickerInput } from '@mantine/dates';

interface DateRangePickerProps {
  value: [Date | null, Date | null];
  onChange: (value: [Date | null, Date | null]) => void;
  placeholder?: string;
  clearable?: boolean;
}

export function DateRangePicker({ 
  value, 
  onChange, 
  placeholder = "Selecciona rango de fechas", 
  clearable = true 
}: DateRangePickerProps) {
  return (
    <DatePickerInput
      type="range"
      placeholder={placeholder}
      value={value}
      onChange={onChange as any}
      clearable={clearable}
    />
  );
}