import { useState, useEffect } from 'react';

export const useElapsedTime = (isRunning: boolean, startTime: Date): number => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  return elapsedTime;
};
