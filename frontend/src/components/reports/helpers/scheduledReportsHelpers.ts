interface ScheduleConfig {
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone?: string;
}

/**
 * Calcula la próxima fecha de ejecución para frecuencia diaria
 */
const calculateDailyNextRun = (now: Date, hours: number, minutes: number): Date => {
  const nextDaily = new Date(now);
  nextDaily.setHours(hours, minutes, 0, 0);
  if (nextDaily <= now) {
    nextDaily.setDate(nextDaily.getDate() + 1);
  }
  return nextDaily;
};

/**
 * Calcula la próxima fecha de ejecución para frecuencia semanal
 */
const calculateWeeklyNextRun = (
  now: Date,
  hours: number,
  minutes: number,
  dayOfWeek: number
): Date => {
  const nextWeekly = new Date(now);
  nextWeekly.setHours(hours, minutes, 0, 0);

  const currentDay = now.getDay();
  const targetDay = dayOfWeek;
  let daysUntilNext = targetDay - currentDay;

  if (daysUntilNext <= 0 || (daysUntilNext === 0 && nextWeekly <= now)) {
    daysUntilNext += 7;
  }

  nextWeekly.setDate(nextWeekly.getDate() + daysUntilNext);
  return nextWeekly;
};

/**
 * Calcula la próxima fecha de ejecución para frecuencia mensual
 */
const calculateMonthlyNextRun = (
  now: Date,
  hours: number,
  minutes: number,
  dayOfMonth: number
): Date => {
  const nextMonthly = new Date(now);
  nextMonthly.setDate(dayOfMonth);
  nextMonthly.setHours(hours, minutes, 0, 0);

  if (nextMonthly <= now) {
    nextMonthly.setMonth(nextMonthly.getMonth() + 1);
  }
  return nextMonthly;
};

/**
 * Calcula la próxima fecha de ejecución para frecuencia trimestral
 */
const calculateQuarterlyNextRun = (
  now: Date,
  hours: number,
  minutes: number,
  dayOfMonth: number
): Date => {
  const nextQuarterly = new Date(now);
  nextQuarterly.setDate(dayOfMonth);
  nextQuarterly.setHours(hours, minutes, 0, 0);

  if (nextQuarterly <= now) {
    nextQuarterly.setMonth(nextQuarterly.getMonth() + 3);
  }
  return nextQuarterly;
};

/**
 * Calcula la próxima fecha de ejecución basada en la frecuencia y configuración
 */
export const getNextRunDate = (frequency: string, scheduleConfig: ScheduleConfig): Date | null => {
  const now = new Date();
  const { time, dayOfWeek, dayOfMonth } = scheduleConfig;

  if (!time) return null;

  const [hours, minutes] = time.split(':').map(Number);

  switch (frequency) {
    case 'daily': {
      return calculateDailyNextRun(now, hours, minutes);
    }
    case 'weekly': {
      if (dayOfWeek === undefined) return null;
      return calculateWeeklyNextRun(now, hours, minutes, dayOfWeek);
    }
    case 'monthly': {
      const day = dayOfMonth || 1;
      return calculateMonthlyNextRun(now, hours, minutes, day);
    }
    case 'quarterly': {
      const day = dayOfMonth || 1;
      return calculateQuarterlyNextRun(now, hours, minutes, day);
    }
    default:
      return null;
  }
};

interface ScheduleStatusResult {
  color: string;
  label: string;
}

interface Schedule {
  isActive: boolean;
  frequency: string;
  scheduleConfig: ScheduleConfig;
}

/**
 * Obtiene el estado de un schedule
 */
export const getScheduleStatus = (schedule: Schedule): ScheduleStatusResult => {
  if (!schedule.isActive) {
    return { color: 'gray', label: 'Inactivo' };
  }

  const nextRun = getNextRunDate(schedule.frequency, schedule.scheduleConfig);
  if (!nextRun) {
    return { color: 'red', label: 'Error en configuración' };
  }

  const hoursUntilNext = (nextRun.getTime() - new Date().getTime()) / (1000 * 60 * 60);

  if (hoursUntilNext <= 24) {
    return { color: 'orange', label: 'Próxima ejecución pronto' };
  }

  return { color: 'green', label: 'Activo' };
};

/**
 * Formatea una fecha para mostrar
 */
export const formatScheduleDate = (date: Date | null): string => {
  if (!date) return 'No programado';
  return date.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Obtiene la descripción de frecuencia en texto legible
 */
export const getFrequencyDescription = (
  frequency: string,
  scheduleConfig: ScheduleConfig
): string => {
  const time = scheduleConfig?.time || '--:--';
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  switch (frequency) {
    case 'daily': {
      return `Diariamente a las ${time}`;
    }
    case 'weekly': {
      const dayName =
        scheduleConfig?.dayOfWeek !== undefined
          ? dayNames[scheduleConfig.dayOfWeek]
          : 'día no definido';
      return `Semanalmente los ${dayName} a las ${time}`;
    }
    case 'monthly': {
      const day = scheduleConfig?.dayOfMonth || '--';
      return `Mensualmente el día ${day} a las ${time}`;
    }
    case 'quarterly': {
      const day = scheduleConfig?.dayOfMonth || '--';
      return `Trimestralmente el día ${day} a las ${time}`;
    }
    default:
      return 'Frecuencia no definida';
  }
};

interface ScheduleFormData {
  name?: string;
  reportDefinitionId?: string;
  frequency?: string;
  scheduleConfig?: ScheduleConfig;
  recipients?: string[];
  exportFormats?: string[];
}

/**
 * Valida los campos básicos de configuración
 */
const validateBasicFields = (data: ScheduleFormData): string[] => {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('El nombre es requerido');
  }

  if (!data.reportDefinitionId) {
    errors.push('Debe seleccionar un reporte');
  }

  if (!data.frequency) {
    errors.push('Debe seleccionar una frecuencia');
  }

  if (!data.scheduleConfig?.time) {
    errors.push('La hora de ejecución es requerida');
  }

  return errors;
};

/**
 * Valida los campos específicos de frecuencia
 */
const validateFrequencyFields = (data: ScheduleFormData): string[] => {
  const errors: string[] = [];

  if (data.frequency === 'weekly' && data.scheduleConfig?.dayOfWeek === undefined) {
    errors.push('El día de la semana es requerido para frecuencia semanal');
  }

  const monthlyFrequencies = ['monthly', 'quarterly'];
  if (monthlyFrequencies.includes(data.frequency || '') && !data.scheduleConfig?.dayOfMonth) {
    errors.push('El día del mes es requerido para frecuencia mensual/trimestral');
  }

  return errors;
};

/**
 * Valida los campos de destinatarios y formatos
 */
const validateOutputFields = (data: ScheduleFormData): string[] => {
  const errors: string[] = [];

  if (!data.recipients?.length) {
    errors.push('Debe especificar al menos un destinatario');
  }

  if (!data.exportFormats?.length) {
    errors.push('Debe seleccionar al menos un formato de exportación');
  }

  return errors;
};

/**
 * Valida la configuración de un schedule
 */
export const validateScheduleConfig = (data: ScheduleFormData): string[] => {
  return [
    ...validateBasicFields(data),
    ...validateFrequencyFields(data),
    ...validateOutputFields(data),
  ];
};
