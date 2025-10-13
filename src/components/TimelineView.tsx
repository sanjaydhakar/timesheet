import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { formatDate, getTodayStart } from '../utils/dateUtils';
import { Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { addDays, addMonths, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, format, isSameMonth } from 'date-fns';

interface TimelineBar {
  allocation: any;
  project: any;
  startPos: number;
  width: number;
}

const TimelineView: React.FC = () => {
  const { developers, projects, allocations } = useData();
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '12months'>('6months');
  const [startDate, setStartDate] = useState(() => {
    const today = getTodayStart();
    return addDays(today, -30); // Start 30 days before today
  });

  const projectColors: Record<string, string> = useMemo(() => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-cyan-500',
    ];
    const colorMap: Record<string, string> = {};
    projects.forEach((project, index) => {
      colorMap[project.id] = colors[index % colors.length];
    });
    return colorMap;
  }, [projects]);

  // Sort developers by current bandwidth (most busy first)
  const sortedDevelopers = useMemo(() => {
    const today = getTodayStart();
    return [...developers].sort((a, b) => {
      const bandwidthA = allocations
        .filter(alloc => alloc.developerId === a.id)
        .reduce((sum, alloc) => {
          const start = new Date(alloc.startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(alloc.endDate);
          end.setHours(0, 0, 0, 0);
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);
          if (start <= todayStart && end >= todayStart) {
            return sum + alloc.bandwidth;
          }
          return sum;
        }, 0);
      
      const bandwidthB = allocations
        .filter(alloc => alloc.developerId === b.id)
        .reduce((sum, alloc) => {
          const start = new Date(alloc.startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(alloc.endDate);
          end.setHours(0, 0, 0, 0);
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);
          if (start <= todayStart && end >= todayStart) {
            return sum + alloc.bandwidth;
          }
          return sum;
        }, 0);
      
      // Sort by bandwidth (most busy first), then by name
      if (bandwidthB !== bandwidthA) {
        return bandwidthB - bandwidthA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [developers, allocations]);

  const getDaysToShow = () => {
    switch (timeRange) {
      case '3months': return 90;
      case '6months': return 180;
      case '12months': return 365;
      default: return 180;
    }
  };

  const daysToShow = getDaysToShow();
  const endDate = addDays(startDate, daysToShow);
  const today = getTodayStart();

  const months = useMemo(() => {
    return eachMonthOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const calculatePosition = (date: Date): number => {
    const daysDiff = differenceInDays(date, startDate);
    return (daysDiff / daysToShow) * 100;
  };

  const getDeveloperTimeline = (developerId: string): TimelineBar[] => {
    const devAllocations = allocations.filter(a => a.developerId === developerId);
    
    return devAllocations
      .map(allocation => {
        const project = projects.find(p => p.id === allocation.projectId);
        if (!project) return null;

        // Clamp dates to visible range
        const allocStart = allocation.startDate < startDate ? startDate : allocation.startDate;
        const allocEnd = allocation.endDate > endDate ? endDate : allocation.endDate;

        // Skip if allocation is completely outside visible range
        if (allocation.endDate < startDate || allocation.startDate > endDate) {
          return null;
        }

        const startPos = calculatePosition(allocStart);
        const endPos = calculatePosition(allocEnd);
        const width = endPos - startPos;

        return {
          allocation,
          project,
          startPos,
          width,
        };
      })
      .filter(bar => bar !== null) as TimelineBar[];
  };

  const handlePrevious = () => {
    setStartDate(prev => addDays(prev, -30));
  };

  const handleNext = () => {
    setStartDate(prev => addDays(prev, 30));
  };

  const handleToday = () => {
    setStartDate(addDays(getTodayStart(), -30));
  };

  const todayPosition = today >= startDate && today <= endDate ? calculatePosition(today) : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Timeline View</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setTimeRange('3months')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === '3months'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                3 Months
              </button>
              <button
                onClick={() => setTimeRange('6months')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === '6months'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => setTimeRange('12months')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === '12months'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                12 Months
              </button>
            </div>

            <div className="flex gap-1">
              <button
                onClick={handlePrevious}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing: {formatDate(startDate)} - {formatDate(endDate)}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Projects</h3>
        <div className="flex flex-wrap gap-3">
          {projects.map(project => (
            <div key={project.id} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${projectColors[project.id]}`}></div>
              <span className="text-sm text-gray-700">{project.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with months */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <div className="w-48 flex-shrink-0 p-3 font-semibold text-gray-700 border-r border-gray-200">
                Developer
              </div>
              <div className="flex-1 relative h-12">
                {months.map((month, index) => {
                  const monthStart = month < startDate ? startDate : month;
                  const monthEnd = endOfMonth(month) > endDate ? endDate : endOfMonth(month);
                  const monthStartPos = calculatePosition(monthStart);
                  const monthEndPos = calculatePosition(monthEnd);
                  const monthWidth = monthEndPos - monthStartPos;

                  return (
                    <div
                      key={index}
                      className="absolute top-0 bottom-0 border-r border-gray-300 flex items-center justify-center"
                      style={{
                        left: `${monthStartPos}%`,
                        width: `${monthWidth}%`,
                      }}
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {format(month, 'MMM yyyy')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Developer rows */}
            {sortedDevelopers.map((developer, devIndex) => {
              const timelineBars = getDeveloperTimeline(developer.id);
              const totalBandwidth = timelineBars.reduce((sum, bar) => {
                // Only count if bar overlaps with today
                if (bar.allocation.startDate <= today && bar.allocation.endDate >= today) {
                  return sum + bar.allocation.bandwidth;
                }
                return sum;
              }, 0);

              return (
                <div
                  key={developer.id}
                  className={`flex ${devIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                >
                  <div className="w-48 flex-shrink-0 p-3 border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {developer.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {totalBandwidth}% allocated
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 relative h-20 border-r border-gray-200">
                    {/* Month dividers */}
                    {months.map((month, index) => {
                      const monthStart = month < startDate ? startDate : month;
                      const pos = calculatePosition(monthStart);
                      return (
                        <div
                          key={index}
                          className="absolute top-0 bottom-0 border-r border-gray-200"
                          style={{ left: `${pos}%` }}
                        />
                      );
                    })}

                    {/* Today indicator */}
                    {todayPosition !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `${todayPosition}%` }}
                        title="Today"
                      />
                    )}

                    {/* Allocation bars */}
                    <div className="absolute inset-0 p-1">
                      {timelineBars.map((bar, barIndex) => (
                        <div
                          key={`${bar.allocation.id}-${barIndex}`}
                          className={`absolute ${projectColors[bar.project.id]} rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow group`}
                          style={{
                            left: `${bar.startPos}%`,
                            width: `${bar.width}%`,
                            top: `${(barIndex * 28) + 4}px`,
                            height: '20px',
                            opacity: 0.9,
                          }}
                          title={`${bar.project.name} - ${bar.allocation.bandwidth}%`}
                        >
                          <div className="h-full flex items-center px-2 text-white text-xs font-medium truncate">
                            <span className="truncate">{bar.project.name}</span>
                            <span className="ml-1 flex-shrink-0">({bar.allocation.bandwidth}%)</span>
                          </div>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                              <div className="font-semibold">{bar.project.name}</div>
                              <div className="mt-1">Bandwidth: {bar.allocation.bandwidth}%</div>
                              <div>{formatDate(bar.allocation.startDate)} - {formatDate(bar.allocation.endDate)}</div>
                              {bar.allocation.notes && (
                                <div className="mt-1 italic">{bar.allocation.notes}</div>
                              )}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                <div className="border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total Developers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{developers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Active Projects</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {projects.filter(p => p.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total Allocations</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{allocations.length}</div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;

