import { UseFormReturnType } from '@mantine/form';
import { FormValues } from '../../../hooks/useFormulaForm';

export interface FormProps {
  form: UseFormReturnType<FormValues>;
}
