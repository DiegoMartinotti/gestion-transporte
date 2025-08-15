import { ScheduledReport } from '../../../types/reports';
import { ScheduleFormData } from './useScheduleForm';
import { UseFormReturnType } from '@mantine/form';

interface UseScheduleHandlersProps {
  createSchedule: (formData: ScheduleFormData) => Promise<ScheduledReport>;
  updateSchedule: (scheduleId: string, formData: ScheduleFormData) => Promise<ScheduledReport>;
  deleteSchedule: (schedule: ScheduledReport) => Promise<void>;
  toggleScheduleActive: (schedule: ScheduledReport) => Promise<void>;
  editingSchedule: ScheduledReport | null;
  setEditingSchedule: (schedule: ScheduledReport | null) => void;
  form: UseFormReturnType<ScheduleFormData>;
  openModal: () => void;
  closeModal: () => void;
  onScheduleCreate?: (schedule: ScheduledReport) => void;
  onScheduleUpdate?: (schedule: ScheduledReport) => void;
  onScheduleDelete?: (scheduleId: string) => void;
}

export const useScheduleHandlers = ({
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleScheduleActive,
  editingSchedule,
  setEditingSchedule,
  form,
  openModal,
  closeModal,
  onScheduleCreate,
  onScheduleUpdate,
  onScheduleDelete,
}: UseScheduleHandlersProps) => {
  const handleCloseModal = () => {
    closeModal();
    form.reset();
    setEditingSchedule(null);
  };

  const handleSubmit = async (values: ScheduleFormData) => {
    try {
      if (editingSchedule) {
        const updatedSchedule = await updateSchedule(editingSchedule.id, values);
        onScheduleUpdate?.(updatedSchedule);
      } else {
        const newSchedule = await createSchedule(values);
        onScheduleCreate?.(newSchedule);
      }
      handleCloseModal();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEdit = (schedule: ScheduledReport) => {
    setEditingSchedule(schedule);
    form.setValues({
      reportDefinitionId: schedule.reportDefinitionId,
      name: schedule.name,
      description: schedule.description || '',
      frequency: schedule.frequency,
      scheduleConfig: schedule.scheduleConfig,
      recipients: schedule.recipients,
      exportFormats: schedule.exportFormats,
      isActive: schedule.isActive,
    });
    openModal();
  };

  const handleDelete = async (schedule: ScheduledReport) => {
    await deleteSchedule(schedule);
    onScheduleDelete?.(schedule.id);
  };

  const handleToggleActive = async (schedule: ScheduledReport) => {
    await toggleScheduleActive(schedule);
  };

  const handleCreateNew = () => {
    setEditingSchedule(null);
    form.reset();
    openModal();
  };

  return {
    handleSubmit,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleCreateNew,
    handleCloseModal,
  };
};
