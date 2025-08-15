import type { ExportState } from './types';

export const createProgressSimulator = (
  updateExportState: (updates: Partial<ExportState>) => void
) => {
  return (duration = 3000): NodeJS.Timeout => {
    let progress = 0;
    const interval = 50;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        updateExportState({ progress: 100 });
      } else {
        updateExportState({ progress: Math.floor(progress) });
      }
    }, interval);

    return timer;
  };
};
