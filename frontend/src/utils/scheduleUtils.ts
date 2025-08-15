import { addDays, addWeeks, addMonths, isBefore } from 'date-fns';
import { ScheduledReport } from '../types/reports';

const calculateDailyNext = (baseDate: Date, now: Date): Date => {
  return baseDate <= now ? addDays(baseDate, 1) : baseDate;
};

const calculateWeeklyNext = (baseDate: Date, now: Date, dayOfWeek?: number): Date => {
  if (dayOfWeek === undefined) return baseDate;

  const daysUntilTarget = (dayOfWeek - baseDate.getDay() + 7) % 7;
  let nextRun = addDays(baseDate, daysUntilTarget);

  if (nextRun <= now) {
    nextRun = addWeeks(nextRun, 1);
  }

  return nextRun;
};

const calculateMonthlyNext = (baseDate: Date, now: Date, dayOfMonth?: number): Date => {
  if (dayOfMonth === undefined) return baseDate;

  baseDate.setDate(dayOfMonth);
  return baseDate <= now ? addMonths(baseDate, 1) : baseDate;
};

const calculateQuarterlyNext = (baseDate: Date, now: Date, dayOfMonth?: number): Date => {
  if (dayOfMonth === undefined) return baseDate;

  baseDate.setDate(dayOfMonth);
  return baseDate <= now ? addMonths(baseDate, 3) : baseDate;
};

export const getNextRunDate = (schedule: ScheduledReport): Date => {
  const now = new Date();
  const { time, dayOfWeek, dayOfMonth } = schedule.scheduleConfig;
  const [hours, minutes] = time.split(':').map(Number);

  const nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case 'daily':
      return calculateDailyNext(nextRun, now);
    case 'weekly':
      return calculateWeeklyNext(nextRun, now, dayOfWeek);
    case 'monthly':
      return calculateMonthlyNext(nextRun, now, dayOfMonth);
    case 'quarterly':
      return calculateQuarterlyNext(nextRun, now, dayOfMonth);
    default:
      return nextRun;
  }
};

export const getScheduleStatus = (schedule: ScheduledReport): string => {
  if (!schedule.isActive) return 'Pausado';

  const now = new Date();
  const nextRun = getNextRunDate(schedule);

  if (isBefore(nextRun, now)) return 'Vencido';
  return 'Activo';
};
