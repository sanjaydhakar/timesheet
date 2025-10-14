import { format, isAfter, isBefore, isWithinInterval, addDays, startOfDay } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, 'MMM dd, yyyy');
};

export const formatDateInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return isWithinInterval(date, { start, end });
};

export const isDateOverlapping = (
  range1Start: Date,
  range1End: Date,
  range2Start: Date,
  range2End: Date
): boolean => {
  return (
    isBefore(range1Start, range2End) && isAfter(range1End, range2Start)
  );
};

export const getTodayStart = (): Date => {
  return startOfDay(new Date());
};

export const getNextAvailableDate = (allocations: Array<{ endDate: Date; bandwidth: number }>): Date | null => {
  const today = getTodayStart();
  const activeAllocations = allocations.filter(a => isAfter(a.endDate, today));
  
  if (activeAllocations.length === 0) {
    return today;
  }
  
  // Find the date when total bandwidth drops below 100%
  const sortedByEndDate = [...activeAllocations].sort((a, b) => 
    a.endDate.getTime() - b.endDate.getTime()
  );
  
  let currentDate = today;
  
  for (const allocation of sortedByEndDate) {
    const bandwidthAtDate = allocations
      .filter(a => isAfter(a.endDate, currentDate))
      .reduce((sum, a) => sum + a.bandwidth, 0);
    
    if (bandwidthAtDate < 100) {
      return currentDate;
    }
    
    currentDate = addDays(allocation.endDate, 1);
  }
  
  return currentDate;
};

