import { useState, useEffect } from 'react';

// Custom hook to manage date range
export const useDateRange = (initialFrom = null, initialTo = null) => {
  const [dateRange, setDateRange] = useState(() => {
    const savedRange = localStorage.getItem('dateRange');
    if (savedRange) {
      return JSON.parse(savedRange);
    }

    return {
      from: initialFrom,
      to: initialTo,
    };
  });

  useEffect(() => {
    localStorage.setItem('dateRange', JSON.stringify(dateRange));
  }, [dateRange]);

  return [dateRange, setDateRange];
};
