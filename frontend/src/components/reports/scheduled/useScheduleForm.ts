import { useForm } from '@mantine/form';
import { ScheduleFrequency, ExportFormat } from '../../../types/reports';

interface ScheduleFormData {
  reportDefinitionId: string;
  name: string;
  description: string;
  frequency: ScheduleFrequency;
  scheduleConfig: {
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  };
  recipients: string[];
  exportFormats: ExportFormat[];
  isActive: boolean;
}

export const useScheduleForm = () => {
  return useForm<ScheduleFormData>({
    initialValues: {
      reportDefinitionId: '',
      name: '',
      description: '',
      frequency: 'daily',
      scheduleConfig: {
        time: '09:00',
        timezone: 'America/Argentina/Buenos_Aires',
      },
      recipients: [],
      exportFormats: ['pdf'],
      isActive: true,
    },
    validate: {
      reportDefinitionId: (value) => (!value ? 'Debe seleccionar un reporte' : null),
      name: (value) => (!value?.trim() ? 'Debe especificar un nombre' : null),
      recipients: (value) => (!value?.length ? 'Debe especificar al menos un destinatario' : null),
      exportFormats: (value) => (!value?.length ? 'Debe seleccionar al menos un formato' : null),
    },
  });
};

export type { ScheduleFormData };
