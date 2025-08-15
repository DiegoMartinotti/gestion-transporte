import {
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  NumberInput,
  Switch,
  Checkbox,
  Radio,
  Stack,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
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

// Render functions for each field type
const renderTextArea = (fieldProps: any, label: string, rows: number) => (
  <Textarea {...fieldProps} label={label} rows={rows} minRows={rows} autosize />
);

const renderEmailInput = (fieldProps: any, label: string) => (
  <TextInput {...fieldProps} type="email" label={label} />
);

const renderPasswordInput = (fieldProps: any, label: string) => (
  <TextInput {...fieldProps} type="password" label={label} />
);

interface NumberInputProps {
  fieldProps: any;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}

const renderNumberInput = (props: NumberInputProps) => (
  <NumberInput
    {...props.fieldProps}
    label={props.label}
    min={props.min}
    max={props.max}
    step={props.step}
    prefix={props.prefix}
    suffix={props.suffix}
    allowDecimal={props.step !== undefined ? props.step < 1 : true}
  />
);

const renderSelect = (fieldProps: any, label: string, options: FormFieldOption[]) => (
  <Select
    {...fieldProps}
    label={label}
    data={options.map((opt) => ({ value: opt.value.toString(), label: opt.label }))}
  />
);

const renderMultiSelect = (fieldProps: any, label: string, options: FormFieldOption[]) => (
  <MultiSelect
    {...fieldProps}
    label={label}
    data={options.map((opt) => ({ value: opt.value.toString(), label: opt.label }))}
  />
);

const renderDateInput = (fieldProps: any, label: string) => (
  <DateInput {...fieldProps} label={label} valueFormat="DD/MM/YYYY" />
);

const renderSwitch = (fieldProps: any, label: string) => (
  <Switch {...fieldProps} label={label} labelPosition="left" />
);

const renderCheckbox = (fieldProps: any, label: string) => (
  <Checkbox {...fieldProps} label={label} />
);

const renderRadioGroup = (fieldProps: any, label: string, options: FormFieldOption[]) => (
  <Radio.Group {...fieldProps} label={label}>
    <Stack>
      {options.map((option) => (
        <Radio key={option.value} value={option.value.toString()} label={option.label} />
      ))}
    </Stack>
  </Radio.Group>
);

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
  radius = 'sm',
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
      error: form.errors[name],
    }),
  };

  const renderField = () => {
    const labelText = label ?? '';
    const renderers = {
      textarea: () => renderTextArea(fieldProps, labelText, rows),
      email: () => renderEmailInput(fieldProps, labelText),
      password: () => renderPasswordInput(fieldProps, labelText),
      number: () =>
        renderNumberInput({ fieldProps, label: labelText, min, max, step, prefix, suffix }),
      select: () => renderSelect(fieldProps, labelText, options),
      multiselect: () => renderMultiSelect(fieldProps, labelText, options),
      date: () => renderDateInput(fieldProps, labelText),
      switch: () => renderSwitch(fieldProps, labelText),
      checkbox: () => renderCheckbox(fieldProps, labelText),
      radio: () => renderRadioGroup(fieldProps, labelText, options),
    };

    const renderer = renderers[type as keyof typeof renderers];
    if (renderer) return renderer();

    return <TextInput {...fieldProps} label={labelText} />;
  };

  return renderField();
}
