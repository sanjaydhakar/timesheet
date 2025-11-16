import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { formatDate, getTodayStart, formatDateInput } from '../utils/dateUtils';
import { Calendar, ChevronLeft, ChevronRight, User, Briefcase, X, Plus } from 'lucide-react';
import { addDays, differenceInDays, eachMonthOfInterval, format } from 'date-fns';
import { Developer, Project } from '../types';

interface TimelineBar {
  allocation: any;
  project: any;
  startPos: number;
  width: number;
}

interface DragSelection {
  rowId: string;
  rowType: 'developer' | 'project';
  startPos: number;
  endPos: number;
}

const TimelineViewEnhanced: React.FC = () => {
  const { developers, projects, allocations, addAllocation, updateAllocation, deleteAllocation, addDeveloper, addProject } = useData();
  const [viewMode, setViewMode] = useState<'resource' | 'project'>('resource');
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '12months'>('6months');
  const [startDate, setStartDate] = useState(() => {
    const today = getTodayStart();
    return addDays(today, -30);
  });
  
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState<any>(null);
  const [showEditAllocation, setShowEditAllocation] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<any>(null);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [savedQuickAddData, setSavedQuickAddData] = useState<any>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Form state for creating developers/projects
  const [newDeveloperForm, setNewDeveloperForm] = useState({
    name: '',
    email: '',
    skills: '',
  });

  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    requiredSkills: '',
    priority: 'medium' as const,
    status: 'planning' as const,
    startDate: '',
    endDate: '',
    devsNeeded: '',
  });

  const projectColors: Record<string, string> = useMemo(() => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-red-500',
      'bg-yellow-500', 'bg-cyan-500',
    ];
    const colorMap: Record<string, string> = {};
    projects.forEach((project, index) => {
      colorMap[project.id] = colors[index % colors.length];
    });
    return colorMap;
  }, [projects]);

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
      
      if (bandwidthB !== bandwidthA) {
        return bandwidthB - bandwidthA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [developers, allocations]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.name.localeCompare(b.name);
    });
  }, [projects]);

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

  const calculateDateFromPosition = (positionPercent: number): Date => {
    const days = Math.floor((positionPercent / 100) * daysToShow);
    return addDays(startDate, days);
  };

  const getResourceTimeline = (developerId: string): TimelineBar[] => {
    const devAllocations = allocations.filter(a => a.developerId === developerId);
    
    return devAllocations
      .map(allocation => {
        const project = projects.find(p => p.id === allocation.projectId);
        if (!project) return null;

        const allocStart = allocation.startDate < startDate ? startDate : allocation.startDate;
        const allocEnd = allocation.endDate > endDate ? endDate : allocation.endDate;

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

  const getProjectTimeline = (projectId: string): TimelineBar[] => {
    const projAllocations = allocations.filter(a => a.projectId === projectId);
    
    return projAllocations
      .map(allocation => {
        const developer = developers.find(d => d.id === allocation.developerId);
        if (!developer) return null;

        const allocStart = allocation.startDate < startDate ? startDate : allocation.startDate;
        const allocEnd = allocation.endDate > endDate ? endDate : allocation.endDate;

        if (allocation.endDate < startDate || allocation.startDate > endDate) {
          return null;
        }

        const startPos = calculatePosition(allocStart);
        const endPos = calculatePosition(allocEnd);
        const width = endPos - startPos;

        return {
          allocation,
          project: developer, // In project view, we show developer name
          startPos,
          width,
        };
      })
      .filter(bar => bar !== null) as TimelineBar[];
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, rowId: string, rowType: 'developer' | 'project') => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const positionPercent = (x / rect.width) * 100;
    
    setIsDragging(true);
    setDragSelection({
      rowId,
      rowType,
      startPos: positionPercent,
      endPos: positionPercent,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragSelection || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const positionPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    setDragSelection({
      ...dragSelection,
      endPos: positionPercent,
    });
  }, [isDragging, dragSelection]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragSelection) return;
    
    setIsDragging(false);
    
    const startPos = Math.min(dragSelection.startPos, dragSelection.endPos);
    const endPos = Math.max(dragSelection.startPos, dragSelection.endPos);
    
    if (Math.abs(endPos - startPos) < 1) {
      setDragSelection(null);
      return;
    }
    
    const dragStartDate = calculateDateFromPosition(startPos);
    const dragEndDate = calculateDateFromPosition(endPos);
    
    setQuickAddData({
      rowId: dragSelection.rowId,
      rowType: dragSelection.rowType,
      startDate: dragStartDate,
      endDate: dragEndDate,
    });
    setShowQuickAdd(true);
    setDragSelection(null);
  }, [isDragging, dragSelection, calculateDateFromPosition]);

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddData) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const newAllocation = {
        id: `alloc${Date.now()}`,
        developerId: quickAddData.rowType === 'developer' ? quickAddData.rowId : formData.get('developer') as string,
        projectId: quickAddData.rowType === 'project' ? quickAddData.rowId : formData.get('project') as string,
        bandwidth: Number(formData.get('bandwidth')),
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        notes: formData.get('notes') as string || '',
      };

      await addAllocation(newAllocation);
      setShowQuickAdd(false);
      setQuickAddData(null);
    } catch (error) {
      console.error('Error adding allocation:', error);
      alert('Failed to add allocation');
    }
  };

  const handleOpenDeveloperModal = () => {
    setSavedQuickAddData(quickAddData);
    setShowQuickAdd(false);
    setNewDeveloperForm({ name: '', email: '', skills: '' });
    setShowDeveloperModal(true);
  };

  const handleOpenProjectModal = () => {
    setSavedQuickAddData(quickAddData);
    setShowQuickAdd(false);
    setNewProjectForm({
      name: '',
      description: '',
      requiredSkills: '',
      priority: 'medium',
      status: 'planning',
      startDate: '',
      endDate: '',
      devsNeeded: '',
    });
    setShowProjectModal(true);
  };

  const handleDeveloperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skills = newDeveloperForm.skills.split(',').map(s => s.trim()).filter(s => s);
    
    try {
      const newDeveloper: Developer = {
        id: `dev${Date.now()}`,
        name: newDeveloperForm.name,
        email: newDeveloperForm.email,
        skills,
      };
      
      await addDeveloper(newDeveloper);
      setShowDeveloperModal(false);
      
      // Return to quick add modal with new developer selected
      if (savedQuickAddData) {
        setQuickAddData({ ...savedQuickAddData, selectedDeveloperId: newDeveloper.id });
        setShowQuickAdd(true);
        setSavedQuickAddData(null);
      }
    } catch (error) {
      console.error('Error creating developer:', error);
      alert('Failed to create developer');
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredSkills = newProjectForm.requiredSkills.split(',').map(s => s.trim()).filter(s => s);
    
    try {
      const newProject: Project = {
        id: `proj${Date.now()}`,
        name: newProjectForm.name,
        description: newProjectForm.description,
        requiredSkills,
        priority: newProjectForm.priority,
        status: newProjectForm.status,
        startDate: newProjectForm.startDate ? new Date(newProjectForm.startDate) : undefined,
        endDate: newProjectForm.endDate ? new Date(newProjectForm.endDate) : undefined,
        devsNeeded: newProjectForm.devsNeeded ? parseInt(newProjectForm.devsNeeded) : undefined,
      };
      
      await addProject(newProject);
      setShowProjectModal(false);
      
      // Return to quick add modal with new project selected
      if (savedQuickAddData) {
        setQuickAddData({ 
          ...savedQuickAddData, 
          selectedProjectId: newProject.id,
          suggestedEndDate: newProject.endDate,
        });
        setShowQuickAdd(true);
        setSavedQuickAddData(null);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
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

  const handleEditAllocation = (allocation: any) => {
    setEditingAllocation(allocation);
    setShowEditAllocation(true);
  };

  const handleUpdateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAllocation) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const updatedAllocation = {
        developerId: editingAllocation.developerId,
        projectId: editingAllocation.projectId,
        bandwidth: Number(formData.get('bandwidth')),
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        notes: formData.get('notes') as string || '',
      };

      await updateAllocation(editingAllocation.id, updatedAllocation);
      setShowEditAllocation(false);
      setEditingAllocation(null);
    } catch (error) {
      console.error('Error updating allocation:', error);
      alert('Failed to update allocation');
    }
  };

  const handleDeleteAllocation = async () => {
    if (!editingAllocation) return;
    
    if (confirm('Are you sure you want to delete this allocation?')) {
      try {
        await deleteAllocation(editingAllocation.id);
        setShowEditAllocation(false);
        setEditingAllocation(null);
      } catch (error) {
        console.error('Error deleting allocation:', error);
        alert('Failed to delete allocation');
      }
    }
  };

  const todayPosition = today >= startDate && today <= endDate ? calculatePosition(today) : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Enhanced Timeline View</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* View Mode Toggle */}
            <div className="flex gap-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <button
                onClick={() => setViewMode('resource')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'resource'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="w-4 h-4" />
                By Developer
              </button>
              <button
                onClick={() => setViewMode('project')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'project'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                By Project
              </button>
            </div>

            {/* Time Range */}
            <div className="flex gap-1 border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setTimeRange('3months')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === '3months'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                3M
              </button>
              <button
                onClick={() => setTimeRange('6months')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === '6months'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                6M
              </button>
              <button
                onClick={() => setTimeRange('12months')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === '12months'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                12M
              </button>
            </div>

            {/* Navigation */}
            <div className="flex gap-1">
              <button
                onClick={handlePrevious}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
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
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing: {formatDate(startDate)} - {formatDate(endDate)}
          </div>
          <div className="text-sm text-gray-600 italic">
            💡 Click and drag on any row to quickly add an allocation
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="flex border-b-2 border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div className="w-52 flex-shrink-0 px-3 py-2 font-semibold text-gray-800 border-r border-gray-200 flex items-center">
                <span className="text-xs uppercase tracking-wide">
                  {viewMode === 'resource' ? 'Team Member' : 'Project'}
                </span>
              </div>
              <div className="flex-1 relative h-14" ref={timelineRef}>
                {months.map((month, index) => {
                  const monthStart = month < startDate ? startDate : month;
                  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0) > endDate 
                    ? endDate 
                    : new Date(month.getFullYear(), month.getMonth() + 1, 0);
                  const monthStartPos = calculatePosition(monthStart);
                  const monthEndPos = calculatePosition(monthEnd);
                  const monthWidth = monthEndPos - monthStartPos;

                  return (
                    <div
                      key={index}
                      className="absolute top-0 bottom-0 border-r border-gray-200 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-gray-50/50"
                      style={{
                        left: `${monthStartPos}%`,
                        width: `${monthWidth}%`,
                      }}
                    >
                      <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">
                        {format(month, 'MMM')}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {format(month, 'yyyy')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rows */}
            <div onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              {viewMode === 'resource' ? (
                // Resource View - Developers as rows
                sortedDevelopers.map((developer, devIndex) => {
                  const timelineBars = getResourceTimeline(developer.id);
                  const totalBandwidth = timelineBars.reduce((sum, bar) => {
                    if (bar.allocation.startDate <= today && bar.allocation.endDate >= today) {
                      return sum + bar.allocation.bandwidth;
                    }
                    return sum;
                  }, 0);

                  const isOverloaded = totalBandwidth > 100;
                  const statusColor = totalBandwidth === 0 ? 'bg-gray-100 text-gray-600' : 
                                     isOverloaded ? 'bg-red-100 text-red-700' : 
                                     totalBandwidth === 100 ? 'bg-orange-100 text-orange-700' : 
                                     'bg-green-100 text-green-700';

                  return (
                    <div
                      key={developer.id}
                      className={`flex border-b border-gray-100 hover:bg-blue-50/50 transition-all group ${
                        devIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <div className="w-52 flex-shrink-0 px-3 py-2 border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <User className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 text-xs truncate">
                              {developer.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusColor}`}>
                                {totalBandwidth}%
                              </span>
                              {isOverloaded && <span className="text-[10px] text-red-600 font-medium">⚠</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div 
                        className="flex-1 relative h-16 border-r border-gray-100 cursor-crosshair bg-gradient-to-b from-transparent to-gray-50/30"
                        onMouseDown={(e) => handleMouseDown(e, developer.id, 'developer')}
                      >
                        {/* Week dividers - subtle grid */}
                        {months.map((month, index) => {
                          const monthStart = month < startDate ? startDate : month;
                          const pos = calculatePosition(monthStart);
                          return (
                            <div
                              key={index}
                              className="absolute top-0 bottom-0 border-r border-gray-100 pointer-events-none"
                              style={{ left: `${pos}%` }}
                            />
                          );
                        })}

                        {/* Today indicator */}
                        {todayPosition !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-400 to-red-600 z-10 pointer-events-none shadow-glow"
                            style={{ left: `${todayPosition}%` }}
                          >
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full shadow-md"></div>
                          </div>
                        )}

                        {/* Drag selection */}
                        {isDragging && dragSelection && dragSelection.rowId === developer.id && (
                          <div
                            className="absolute top-0 bottom-0 bg-primary-300 opacity-50 pointer-events-none z-20"
                            style={{
                              left: `${Math.min(dragSelection.startPos, dragSelection.endPos)}%`,
                              width: `${Math.abs(dragSelection.endPos - dragSelection.startPos)}%`,
                            }}
                          />
                        )}

                        {/* Allocation bars */}
                        <div className="absolute inset-0 p-2 pointer-events-auto">
                          {timelineBars.map((bar, barIndex) => {
                            const barHeight = bar.allocation.bandwidth === 50 ? 12 : 24;
                            const topOffset = bar.allocation.bandwidth === 50 
                              ? (barIndex * 32) + 12 // Center 50% bars
                              : (barIndex * 32) + 6;
                            
                            return (
                              <div
                                key={`${bar.allocation.id}-${barIndex}`}
                                className={`absolute ${projectColors[bar.project.id]} rounded-lg shadow-md group cursor-pointer hover:opacity-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 border-2 border-white/20`}
                                style={{
                                  left: `${bar.startPos}%`,
                                  width: `${bar.width}%`,
                                  top: `${topOffset}px`,
                                  height: `${barHeight}px`,
                                  opacity: 0.95,
                                }}
                                title={`${bar.project.name} - ${bar.allocation.bandwidth}%${bar.allocation.createdByName ? ` - Created by ${bar.allocation.createdByName}` : ''}${bar.allocation.createdAt ? ` on ${formatDate(bar.allocation.createdAt)}` : ''} - Click to edit`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAllocation(bar.allocation);
                                }}
                              >
                                <div className="h-full flex items-center justify-between px-2 text-white text-[10px] font-semibold">
                                  <span className="truncate">{bar.project.name}</span>
                                  <span className="ml-1 px-1 py-0.5 bg-white/20 rounded text-[9px] flex-shrink-0">{bar.allocation.bandwidth}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Project View - Projects as rows
                sortedProjects.map((project, projIndex) => {
                  const timelineBars = getProjectTimeline(project.id);
                  const activeDevelopers = new Set(
                    allocations
                      .filter(a => a.projectId === project.id && a.endDate >= today)
                      .map(a => a.developerId)
                  ).size;

                  const priorityColors = {
                    low: 'bg-gray-100 text-gray-700',
                    medium: 'bg-blue-100 text-blue-700',
                    high: 'bg-orange-100 text-orange-700',
                    critical: 'bg-red-100 text-red-700'
                  };

                  return (
                    <div
                      key={project.id}
                      className={`flex border-b border-gray-100 hover:bg-purple-50/50 transition-all group ${
                        projIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <div className="w-52 flex-shrink-0 px-3 py-2 border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 ${projectColors[project.id]} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <Briefcase className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 text-xs truncate">
                              {project.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${priorityColors[project.priority]}`}>
                                {project.priority}
                              </span>
                              <span className={`text-[10px] ${
                                project.devsNeeded 
                                  ? (activeDevelopers < project.devsNeeded ? 'text-yellow-600' : 
                                     activeDevelopers === project.devsNeeded ? 'text-green-600' : 
                                     'text-red-600')
                                  : 'text-gray-500'
                              }`}>
                                {project.devsNeeded 
                                  ? `${activeDevelopers}/${project.devsNeeded} dev${project.devsNeeded !== 1 ? 's' : ''}`
                                  : `${activeDevelopers} dev${activeDevelopers !== 1 ? 's' : ''}`
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div 
                        className="flex-1 relative border-r border-gray-100 cursor-crosshair bg-gradient-to-b from-transparent to-gray-50/30"
                        style={{
                          height: `${Math.max(64, timelineBars.length * 16 + 8)}px`
                        }}
                        onMouseDown={(e) => handleMouseDown(e, project.id, 'project')}
                      >
                        {/* Month dividers */}
                        {months.map((month, index) => {
                          const monthStart = month < startDate ? startDate : month;
                          const pos = calculatePosition(monthStart);
                          return (
                            <div
                              key={index}
                              className="absolute top-0 bottom-0 border-r border-gray-100 pointer-events-none"
                              style={{ left: `${pos}%` }}
                            />
                          );
                        })}

                        {/* Today indicator */}
                        {todayPosition !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-400 to-red-600 z-10 pointer-events-none shadow-glow"
                            style={{ left: `${todayPosition}%` }}
                          >
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full shadow-md"></div>
                          </div>
                        )}

                        {/* Drag selection */}
                        {isDragging && dragSelection && dragSelection.rowId === project.id && (
                          <div
                            className="absolute top-0 bottom-0 bg-primary-300 opacity-50 pointer-events-none z-20"
                            style={{
                              left: `${Math.min(dragSelection.startPos, dragSelection.endPos)}%`,
                              width: `${Math.abs(dragSelection.endPos - dragSelection.startPos)}%`,
                            }}
                          />
                        )}

                        {/* Allocation bars (showing developers) */}
                        <div className="absolute inset-0 p-1 pointer-events-auto">
                          {timelineBars.map((bar, barIndex) => {
                            const barHeight = bar.allocation.bandwidth === 50 ? 10 : 14;
                            const spacing = 16; // Tighter spacing between bars
                            const topOffset = bar.allocation.bandwidth === 50 
                              ? (barIndex * spacing) + (spacing - barHeight) / 2 + 2 // Center 50% bars
                              : (barIndex * spacing) + 2;
                            
                            return (
                              <div
                                key={`${bar.allocation.id}-${barIndex}`}
                                className={`absolute ${projectColors[project.id]} rounded shadow-sm group cursor-pointer hover:opacity-100 hover:shadow-lg transition-all`}
                                style={{
                                  left: `${bar.startPos}%`,
                                  width: `${bar.width}%`,
                                  top: `${topOffset}px`,
                                  height: `${barHeight}px`,
                                  opacity: 0.9,
                                }}
                                title={`${bar.project.name} - ${bar.allocation.bandwidth}%${bar.allocation.createdByName ? ` - Created by ${bar.allocation.createdByName}` : ''}${bar.allocation.createdAt ? ` on ${formatDate(bar.allocation.createdAt)}` : ''} - Click to edit`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAllocation(bar.allocation);
                                }}
                              >
                                <div className="h-full flex items-center px-2 text-white text-[10px] font-medium truncate">
                                  <span className="truncate">{bar.project.name}</span>
                                  <span className="ml-1 flex-shrink-0">({bar.allocation.bandwidth}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && quickAddData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Quick Add Allocation</h3>
              <button onClick={() => {
                setShowQuickAdd(false);
                setQuickAddData(null);
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              {quickAddData.rowType === 'developer' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Developer</label>
                  <input
                    type="text"
                    value={developers.find(d => d.id === quickAddData.rowId)?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Developer</label>
                    <button
                      type="button"
                      onClick={handleOpenDeveloperModal}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add New
                    </button>
                  </div>
                  <select
                    name="developer"
                    required
                    defaultValue={quickAddData.selectedDeveloperId || developers[0]?.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {developers.map(dev => (
                      <option key={dev.id} value={dev.id}>{dev.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {quickAddData.rowType === 'project' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <input
                    type="text"
                    value={projects.find(p => p.id === quickAddData.rowId)?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Project</label>
                    <button
                      type="button"
                      onClick={handleOpenProjectModal}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add New
                    </button>
                  </div>
                  <select
                    name="project"
                    required
                    defaultValue={quickAddData.selectedProjectId || projects[0]?.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bandwidth</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="bandwidth" value="50" className="w-4 h-4" />
                    <span className="text-sm">50% (Half-time)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="bandwidth" value="100" defaultChecked className="w-4 h-4" />
                    <span className="text-sm">100% (Full-time)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    defaultValue={formatDateInput(quickAddData.startDate)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    defaultValue={quickAddData.suggestedEndDate ? formatDateInput(quickAddData.suggestedEndDate) : formatDateInput(quickAddData.endDate)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Add any notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAdd(false);
                    setQuickAddData(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Allocation Modal */}
      {showEditAllocation && editingAllocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Edit Allocation</h3>
              <button
                onClick={() => {
                  setShowEditAllocation(false);
                  setEditingAllocation(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateAllocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Developer</label>
                <input
                  type="text"
                  value={developers.find(d => d.id === editingAllocation.developerId)?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <input
                  type="text"
                  value={projects.find(p => p.id === editingAllocation.projectId)?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bandwidth</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="bandwidth"
                      value="50"
                      defaultChecked={editingAllocation.bandwidth === 50}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">50% (Half-time)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="bandwidth"
                      value="100"
                      defaultChecked={editingAllocation.bandwidth === 100}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">100% (Full-time)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    defaultValue={formatDateInput(editingAllocation.startDate)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    defaultValue={formatDateInput(editingAllocation.endDate)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingAllocation.notes || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Add any notes..."
                />
              </div>

              {/* Allocation Tracking Information */}
              {(editingAllocation.createdByName || editingAllocation.createdAt) && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Allocation Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {editingAllocation.createdByName && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Created by:</span>
                        <span>{editingAllocation.createdByName}</span>
                        {editingAllocation.createdByEmail && (
                          <span className="text-gray-500">({editingAllocation.createdByEmail})</span>
                        )}
                      </div>
                    )}
                    {editingAllocation.createdAt && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Created on:</span>
                        <span>{formatDate(editingAllocation.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteAllocation}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAllocation(false);
                    setEditingAllocation(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Developer Creation Modal */}
      {showDeveloperModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add New Developer</h3>
              <button
                onClick={() => {
                  setShowDeveloperModal(false);
                  if (savedQuickAddData) {
                    setQuickAddData(savedQuickAddData);
                    setShowQuickAdd(true);
                    setSavedQuickAddData(null);
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleDeveloperSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={newDeveloperForm.name}
                  onChange={(e) => setNewDeveloperForm({ ...newDeveloperForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newDeveloperForm.email}
                  onChange={(e) => setNewDeveloperForm({ ...newDeveloperForm, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated) *</label>
                <input
                  type="text"
                  required
                  value={newDeveloperForm.skills}
                  onChange={(e) => setNewDeveloperForm({ ...newDeveloperForm, skills: e.target.value })}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeveloperModal(false);
                    if (savedQuickAddData) {
                      setQuickAddData(savedQuickAddData);
                      setShowQuickAdd(true);
                      setSavedQuickAddData(null);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Developer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Creation Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add New Project</h3>
              <button
                onClick={() => {
                  setShowProjectModal(false);
                  if (savedQuickAddData) {
                    setQuickAddData(savedQuickAddData);
                    setShowQuickAdd(true);
                    setSavedQuickAddData(null);
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                  placeholder="Website Redesign"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                  placeholder="Complete overhaul of company website"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated) *</label>
                <input
                  type="text"
                  required
                  value={newProjectForm.requiredSkills}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, requiredSkills: e.target.value })}
                  placeholder="React, Design, Backend"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newProjectForm.priority}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newProjectForm.status}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
                  <input
                    type="date"
                    value={newProjectForm.startDate}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={newProjectForm.endDate}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Developers Needed (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newProjectForm.devsNeeded}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, devsNeeded: e.target.value })}
                  placeholder="How many developers are needed?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectModal(false);
                    if (savedQuickAddData) {
                      setQuickAddData(savedQuickAddData);
                      setShowQuickAdd(true);
                      setSavedQuickAddData(null);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total {viewMode === 'resource' ? 'Developers' : 'Projects'}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {viewMode === 'resource' ? developers.length : projects.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Active {viewMode === 'resource' ? 'Allocations' : 'Projects'}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {viewMode === 'resource' 
              ? allocations.filter(a => a.endDate >= today).length
              : projects.filter(p => p.status === 'active').length
            }
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">View Mode</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {viewMode === 'resource' ? 'By Developer' : 'By Project'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineViewEnhanced;

