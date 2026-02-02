import { useEffect, useState } from 'react';
import { getEATTime, formatEATDate, formatEATTime } from '@/lib/timezone';

export const useLiveClock = () => {
  const [time, setTime] = useState(getEATTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getEATTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    time,
    formattedDate: formatEATDate(time),
    formattedTime: formatEATTime(time)
  };
};
