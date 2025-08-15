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
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los reportes programados',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (formData: ScheduleFormData) => {
    try {
      const newSchedule = await reportService.createScheduledReport(formData);
      setSchedules((prev) => [newSchedule, ...prev]);
      notifications.show({
        title: 'Reporte programado',
        message: 'El reporte se programó correctamente',
        color: 'green',
      });
      return newSchedule;
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo programar el reporte',
        color: 'red',
      });
      throw error;
    }
  }, []);

  const updateSchedule = useCallback(async (scheduleId: string, formData: ScheduleFormData) => {
    try {
      const updatedSchedule = await reportService.updateScheduledReport(scheduleId, formData);
      setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? updatedSchedule : s)));
      notifications.show({
        title: 'Reporte actualizado',
        message: 'El reporte programado se actualizó correctamente',
        color: 'green',
      });
      return updatedSchedule;
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo actualizar el reporte',
        color: 'red',
      });
      throw error;
    }
  }, []);

  const deleteSchedule = useCallback(async (schedule: ScheduledReport) => {
    try {
      await reportService.deleteScheduledReport(schedule.id);
      setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
      notifications.show({
        title: 'Reporte eliminado',
        message: 'El reporte programado se eliminó correctamente',
        color: 'green',
      });
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el reporte programado',
        color: 'red',
      });
    }
  }, []);

  const toggleScheduleActive = useCallback(async (schedule: ScheduledReport) => {
    try {
      const updatedSchedule = await reportService.updateScheduledReport(schedule.id, {
        ...schedule,
        isActive: !schedule.isActive,
      });
      setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? updatedSchedule : s)));
      notifications.show({
        title: schedule.isActive ? 'Reporte pausado' : 'Reporte activado',
        message: `El reporte se ${schedule.isActive ? 'pausó' : 'activó'} correctamente`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error toggling schedule:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo cambiar el estado del reporte',
        color: 'red',
      });
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
