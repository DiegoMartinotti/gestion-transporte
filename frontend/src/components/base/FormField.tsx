import { 
  TextInput, 
  Textarea, 
  Select, 
  MultiSelect, 
  NumberInput, 
  Switch,
  Checkbox,
  Radio,
  Group,
  Stack,
  Text,
  Box
} from '@mantine/core';
import { DatePickerInput, DateInput } from '@mantine/dates';
import { UseFormReturnType } from '@mantine/form';

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'select' 
  | 'multiselect' 
  | 'date' 
  | 'datetime' 
  | 'switch' 
  | 'checkbox'
  | 'radio';

export interface FormFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormFieldProps {
  name: string;
  label?: string;
  type?: FormFieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  form?: UseFormReturnType<any>;
  options?: FormFieldOption[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  withAsterisk?: boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  description,
  required = false,
  disabled = false,
  form,
  options = [],
  rows = 3,
  min,
  max,
  step,
  prefix,
  suffix,
  withAsterisk,
  leftSection,
  rightSection,
  size = 'sm',
  radius = 'sm'
}: FormFieldProps) {
  const fieldProps = {
    size,
    radius,
    disabled,
    placeholder,
    description,
    withAsterisk: withAsterisk ?? required,
    leftSection,
    rightSection,
    ...(form && {
      ...form.getInputProps(name),
      error: form.errors[name]
    })
  };

  const renderField = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...fieldProps}
            label={label}
            rows={rows}
            minRows={rows}
            autosize
          />
        );

      case 'email':
        return (
          <TextInput
            {...fieldProps}
            type="email"
            label={label}
          />
        );

      case 'password':
        return (
          <TextInput
            {...fieldProps}
            type="password"
            label={label}
          />
        );

      case 'number':
        return (
          <NumberInput
            {...fieldProps}
            label={label}
            min={min}
            max={max}
            step={step}
            prefix={prefix}
            suffix={suffix}
            allowDecimal={step !== undefined ? step < 1 : true}
            allowNegative={min === undefined || min < 0}
            hideControls={false}
          />
        );

      case 'select':
        return (
          <Select
            {...fieldProps}
            label={label}
            data={options}
            searchable
            clearable
          />
        );

      case 'multiselect':
        return (
          <MultiSelect
            {...fieldProps}
            label={label}
            data={options}
            searchable
            clearable
          />
        );

      case 'date':
        return (
          <DateInput
            {...fieldProps}
            label={label}
            valueFormat="DD/MM/YYYY"
            clearable
          />
        );

      case 'datetime':
        return (
          <DateInput
            {...fieldProps}
            label={label}
            valueFormat="DD/MM/YYYY HH:mm"
            clearable
          />
        );

      case 'switch':
        return (
          <Switch
            {...fieldProps}
            label={label}
            size={size}
          />
        );

      case 'checkbox':
        return (
          <Checkbox
            {...fieldProps}
            label={label}
            size={size}
          />
        );

      case 'radio':
        return (
          <Radio.Group
            {...fieldProps}
            label={label}
          >
            <Stack gap="xs">
              {options.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  disabled={option.disabled || disabled}
                  size={size}
                />
              ))}
            </Stack>
          </Radio.Group>
        );

      default:
        return (
          <TextInput
            {...fieldProps}
            label={label}
            type={type}
          />
        );
    }
  };

  return renderField();
}