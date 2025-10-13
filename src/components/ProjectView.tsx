import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ProjectWithAllocations } from '../types';
import { formatDate, getTodayStart } from '../utils/dateUtils';
import { Briefcase, Users, Calendar, AlertCircle, Filter, ChevronDown, ChevronRight, Edit2, Eye, Plus, TrendingUp } from 'lucide-react';
import { isAfter } from 'date-fns';

const ProjectView: React.FC = () => {
  const { projects, developers, allocations } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'priority' | 'resources'>('priority');

  const projectsWithAllocations: ProjectWithAllocations[] = useMemo(() => {
    return projects.map(project => {
      const projAllocations = allocations
        .filter(a => a.projectId === project.id)
        .map(allocation => ({
          ...allocation,
          developer: developers.find(d => d.id === allocation.developerId)!,
        }));

      const totalBandwidth = projAllocations.reduce((sum, a) => sum + a.bandwidth, 0);
      
      const activeDates = projAllocations
        .filter(a => isAfter(a.endDate, getTodayStart()))
        .map(a => a.endDate);
      
      const estimatedCompletion = activeDates.length > 0
        ? new Date(Math.max(...activeDates.map(d => d.getTime())))
        : null;

      return {
        ...project,
        allocations: projAllocations,
        totalBandwidth,
        estimatedCompletion,
      };
    });
  }, [projects, developers, allocations]);

  const filteredProjects = useMemo(() => {
    let filtered = projectsWithAllocations.filter(proj => {
      const matchesStatus = !statusFilter || proj.status === statusFilter;
      const matchesPriority = !priorityFilter || proj.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });

    // Sort based on selected criteria
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (diff !== 0) return diff;
      } else if (sortBy === 'resources') {
        const diff = b.allocations.length - a.allocations.length;
        if (diff !== 0) return diff;
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [projectsWithAllocations, statusFilter, priorityFilter, sortBy]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'on-hold': return 'bg-gray-100 text-gray-700';
      case 'completed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const stats = useMemo(() => {
    const active = filteredProjects.filter(p => p.status === 'active').length;
    const planning = filteredProjects.filter(p => p.status === 'planning').length;
    const critical = filteredProjects.filter(p => p.priority === 'critical').length;
    return { active, planning, critical, total: filteredProjects.length };
  }, [filteredProjects]);

  const getResourceHealth = (project: ProjectWithAllocations) => {
    if (!project.devsNeeded) return null;
    const assigned = project.allocations.length;
    const needed = project.devsNeeded;
    if (assigned < needed) return { status: 'understaffed', text: `${assigned}/${needed} devs`, color: 'text-red-600' };
    if (assigned === needed) return { status: 'optimal', text: `${assigned}/${needed} devs`, color: 'text-green-600' };
    return { status: 'overstaffed', text: `${assigned}/${needed} devs`, color: 'text-orange-600' };
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-600">Total Projects</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-3">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-3">
          <div className="text-2xl font-bold text-blue-600">{stats.planning}</div>
          <div className="text-xs text-gray-600">In Planning</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-3">
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-xs text-gray-600">Critical Priority</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="priority">Sort by Priority</option>
            <option value="resources">Sort by Resources</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Compact Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-10"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Skills Required</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Resources</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden sm:table-cell">Bandwidth</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">ETA</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProjects.map(project => {
                const isExpanded = expandedRows.has(project.id);
                const resourceHealth = getResourceHealth(project);
                
                return (
                  <React.Fragment key={project.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(project.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">{project.name}</div>
                            {project.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">{project.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {project.requiredSkills.slice(0, 2).map(skill => (
                            <span key={skill} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {project.requiredSkills.length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{project.requiredSkills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{project.allocations.length}</span>
                          {resourceHealth && (
                            <span className={`text-xs ${resourceHealth.color}`}>
                              ({resourceHealth.text})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="text-sm font-medium text-gray-900">{project.totalBandwidth}%</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {project.estimatedCompletion ? (
                          <div className="text-xs text-gray-600">{formatDate(project.estimatedCompletion)}</div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="px-4 py-3">
                          <div className="space-y-3">
                            {/* Project Details */}
                            {project.description && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1">Description</div>
                                <div className="text-sm text-gray-600">{project.description}</div>
                              </div>
                            )}

                            {/* Timeline */}
                            {(project.startDate || project.endDate) && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Timeline
                                </div>
                                <div className="text-sm text-gray-600">
                                  {project.startDate && `Start: ${formatDate(project.startDate)}`}
                                  {project.startDate && project.endDate && ' • '}
                                  {project.endDate && `End: ${formatDate(project.endDate)}`}
                                </div>
                              </div>
                            )}
                            
                            {/* All Required Skills */}
                            {project.requiredSkills.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  Required Skills
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {project.requiredSkills.map(skill => (
                                    <span key={skill} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Assigned Developers */}
                            {project.allocations.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  Assigned Developers
                                </div>
                                <div className="space-y-1.5">
                                  {project.allocations
                                    .sort((a, b) => b.bandwidth - a.bandwidth)
                                    .map(allocation => (
                                      <div key={allocation.id} className="flex items-center justify-between bg-white rounded p-2 text-xs">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xs font-medium">
                                              {allocation.developer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </span>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">{allocation.developer.name}</div>
                                            <div className="text-gray-500">
                                              {formatDate(allocation.startDate)} → {formatDate(allocation.endDate)}
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {allocation.developer.skills.slice(0, 3).map(skill => (
                                              <span key={skill} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                                                {skill}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="text-primary-600 font-semibold ml-2">
                                          {allocation.bandwidth}%
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                            
                            {project.allocations.length === 0 && (
                              <div className="text-xs text-gray-500 italic text-center py-2">
                                No developers assigned yet
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-500 text-sm">No projects found</div>
            {(statusFilter || priorityFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setPriorityFilter('');
                }}
                className="mt-2 text-primary-600 text-sm hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectView;

