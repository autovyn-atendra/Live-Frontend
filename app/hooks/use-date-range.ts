import { useState, useEffect } from 'react';

// Custom hook to manage date range
export const useDateRange = (initialFrom = null, initialTo = null) => {
  const [dateRange, setDateRange] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedRange = localStorage.getItem('dateRange');
        if (savedRange) {
          return JSON.parse(savedRange);
        }
      } catch (_) {}
    }

    return {
      from: initialFrom,
      to: initialTo,
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dateRange', JSON.stringify(dateRange));
      } catch (_) {}
    }
  }, [dateRange]);

  return [dateRange, setDateRange];
};
