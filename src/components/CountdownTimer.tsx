import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // 30-day launch deadline, persisted in localStorage so the countdown
    // is real and consistent across reloads/sessions.
    const STORAGE_KEY = 'clipealo_launch_deadline';
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    let launchDate: number;
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = stored ? parseInt(stored, 10) : NaN;

    if (!isNaN(parsed) && parsed > Date.now()) {
      launchDate = parsed;
    } else {
      launchDate = Date.now() + THIRTY_DAYS_MS;
      try {
        localStorage.setItem(STORAGE_KEY, String(launchDate));
      } catch {}
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = launchDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeUnits = [
    { value: timeLeft.days, label: 'Días' },
    { value: timeLeft.hours, label: 'Horas' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Seg' },
  ];

  return (
    <div className="flex justify-center gap-2 sm:gap-3 md:gap-5">
      {timeUnits.map((unit, index) => (
        <motion.div
          key={unit.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className="countdown-card glow-purple min-w-[60px] sm:min-w-[70px] md:min-w-[100px]"
        >
          <motion.span
            key={unit.value}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="countdown-number"
          >
            {String(unit.value).padStart(2, '0')}
          </motion.span>
          <p className="countdown-label">{unit.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default CountdownTimer;
