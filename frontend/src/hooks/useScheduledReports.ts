import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { ScheduledReport, ScheduleFrequency, ExportFormat } from '../types/reports';
import { reportService } from '../services/reportService';

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

// Helper functions extracted from main hook
const showErrorNotification = (title: string, message: string) => {
  notifications.show({
    title,
    message,
    color: 'red',
  });
};

const showSuccessNotification = (title: string, message: string) => {
  notifications.show({
    title,
    message,
    color: 'green',
  });
};

export const useScheduledReports = () => {
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportService.getScheduledReports();
      setSchedules(data);
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
      showErrorNotification('Error', 'No se pudieron cargar los reportes programados');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (formData: ScheduleFormData) => {
    try {
      const newSchedule = await reportService.createScheduledReport(formData);
      setSchedules((prev) => [newSchedule, ...prev]);
      showSuccessNotification('Reporte programado', 'El reporte se programó correctamente');
      return newSchedule;
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      showErrorNotification('Error', 'No se pudo programar el reporte');
      throw error;
    }
  }, []);

  const updateSchedule = useCallback(async (scheduleId: string, formData: ScheduleFormData) => {
    try {
      const updatedSchedule = await reportService.updateScheduledReport(scheduleId, formData);
      setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? updatedSchedule : s)));
      showSuccessNotification(
        'Reporte actualizado',
        'El reporte programado se actualizó correctamente'
      );
      return updatedSchedule;
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      showErrorNotification('Error', 'No se pudo actualizar el reporte');
      throw error;
    }
  }, []);

  const deleteSchedule = useCallback(async (schedule: ScheduledReport) => {
    try {
      await reportService.deleteScheduledReport(schedule.id);
      setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
      showSuccessNotification(
        'Reporte eliminado',
        'El reporte programado se eliminó correctamente'
      );
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      showErrorNotification('Error', 'No se pudo eliminar el reporte programado');
    }
  }, []);

  const toggleScheduleActive = useCallback(async (schedule: ScheduledReport) => {
    try {
      const updatedSchedule = await reportService.updateScheduledReport(schedule.id, {
        ...schedule,
        isActive: !schedule.isActive,
      });
      setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? updatedSchedule : s)));
      showSuccessNotification(
        schedule.isActive ? 'Reporte pausado' : 'Reporte activado',
        `El reporte se ${schedule.isActive ? 'pausó' : 'activó'} correctamente`
      );
    } catch (error) {
      console.error('Error toggling schedule:', error);
      showErrorNotification('Error', 'No se pudo cambiar el estado del reporte');
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  return {
    schedules,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleActive,
    loadSchedules,
  };
};
