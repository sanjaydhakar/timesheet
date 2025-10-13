import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ProjectWithAllocations } from '../types';
import { formatDate, getTodayStart } from '../utils/dateUtils';
import { Briefcase, Users, Calendar, AlertCircle, Filter } from 'lucide-react';
import { isAfter } from 'date-fns';

const ProjectView: React.FC = () => {
  const { projects, developers, allocations } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

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
    return projectsWithAllocations.filter(proj => {
      const matchesStatus = !statusFilter || proj.status === statusFilter;
      const matchesPriority = !priorityFilter || proj.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [projectsWithAllocations, statusFilter, priorityFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 items-center">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <AlertCircle className="w-5 h-5 text-gray-500" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredProjects.map(project => (
          <div key={project.id} className={`bg-white rounded-lg shadow-md border-l-4 ${getPriorityColor(project.priority).split(' ')[3]}`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-600">{project.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace('-', ' ').toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(project.priority)}`}>
                    {project.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Required Skills:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {project.allocations.length} Developer{project.allocations.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {project.estimatedCompletion && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      ETA: {formatDate(project.estimatedCompletion)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Total Bandwidth: {project.totalBandwidth}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Assigned Developers:</h4>
                {project.allocations.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No developers assigned yet</p>
                ) : (
                  <div className="space-y-2">
                    {project.allocations
                      .sort((a, b) => b.bandwidth - a.bandwidth)
                      .map(allocation => (
                        <div key={allocation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{allocation.developer.name}</h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(allocation.startDate)} → {formatDate(allocation.endDate)}
                            </p>
                            {allocation.notes && (
                              <p className="text-sm text-gray-500 italic mt-1">{allocation.notes}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {allocation.developer.skills.slice(0, 5).map(skill => (
                                <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-semibold text-primary-600">{allocation.bandwidth}%</div>
                            <div className="text-xs text-gray-500">Bandwidth</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectView;

