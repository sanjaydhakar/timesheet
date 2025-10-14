import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ProjectWithAllocations, Project, Allocation } from '../types';
import { formatDate, formatDateInput, getTodayStart } from '../utils/dateUtils';
import { Briefcase, Users, Calendar, ChevronDown, ChevronRight, Edit2, Eye, Plus, TrendingUp, X, Trash2 } from 'lucide-react';
import { isAfter } from 'date-fns';

const ProjectView: React.FC = () => {
  const { projects, developers, allocations, addProject, updateProject, deleteProject, addAllocation, updateAllocation, deleteAllocation } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'priority' | 'resources'>('priority');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
  const [projectForm, setProjectForm] = useState<{
    name: string;
    description: string;
    requiredSkills: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    startDate: string;
    endDate: string;
    devsNeeded: string;
  }>({
    name: '',
    description: '',
    requiredSkills: '',
    priority: 'medium',
    status: 'planning',
    startDate: '',
    endDate: '',
    devsNeeded: '',
  });
  const [allocationForm, setAllocationForm] = useState({
    developerId: '',
    projectId: '',
    bandwidth: 100 as 50 | 100,
    startDate: formatDateInput(new Date()),
    endDate: formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    notes: '',
  });

  const projectsWithAllocations: ProjectWithAllocations[] = useMemo(() => {
    return projects.map(project => {
      const projAllocations = allocations
        .filter(a => a.projectId === project.id)
        .map(allocation => ({
          ...allocation,
          developer: developers.find(d => d.id === allocation.developerId)!,
        }));

      const totalBandwidth = projAllocations.reduce((sum, a) => sum + a.bandwidth, 0);
      
      // Normalize bandwidth based on devs needed (if specified)
      // E.g., if 2 devs needed (200% capacity) and 1 dev at 100% allocated, show 50%
      const normalizedBandwidth = project.devsNeeded 
        ? Math.round((totalBandwidth / (project.devsNeeded * 100)) * 100)
        : totalBandwidth;
      
      const activeDates = projAllocations
        .filter(a => isAfter(a.endDate, getTodayStart()))
        .map(a => a.endDate);
      
      const estimatedCompletion = activeDates.length > 0
        ? new Date(Math.max(...activeDates.map(d => d.getTime())))
        : null;

      return {
        ...project,
        allocations: projAllocations,
        totalBandwidth: normalizedBandwidth,
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

  const openAddProjectModal = () => {
    setEditingProject(null);
    setProjectForm({
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

  const openEditProjectModal = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || '',
      requiredSkills: project.requiredSkills.join(', '),
      priority: project.priority,
      status: project.status,
      startDate: project.startDate ? formatDateInput(project.startDate) : '',
      endDate: project.endDate ? formatDateInput(project.endDate) : '',
      devsNeeded: project.devsNeeded ? String(project.devsNeeded) : '',
    });
    setShowProjectModal(true);
  };

  const closeProjectModal = () => {
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const openAddAllocationModal = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setEditingAllocation(null);
    setAllocationForm({
      developerId: developers[0]?.id || '',
      projectId: projectId,
      bandwidth: 100,
      startDate: formatDateInput(new Date()),
      endDate: project?.endDate 
        ? formatDateInput(project.endDate)
        : formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      notes: '',
    });
    setShowAllocationModal(true);
  };

  const closeAllocationModal = () => {
    setShowAllocationModal(false);
    setEditingAllocation(null);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredSkills = projectForm.requiredSkills.split(',').map(s => s.trim()).filter(s => s);
    
    const projectData = {
      name: projectForm.name,
      description: projectForm.description,
      requiredSkills,
      priority: projectForm.priority,
      status: projectForm.status,
      startDate: projectForm.startDate ? new Date(projectForm.startDate) : undefined,
      endDate: projectForm.endDate ? new Date(projectForm.endDate) : undefined,
      devsNeeded: projectForm.devsNeeded ? parseInt(projectForm.devsNeeded) : undefined,
    };

    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject({
        id: `proj${Date.now()}`,
        ...projectData,
      } as Project);
    }
    closeProjectModal();
  };

  const handleAllocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAllocation) {
      updateAllocation(editingAllocation.id, {
        developerId: allocationForm.developerId,
        projectId: allocationForm.projectId,
        bandwidth: allocationForm.bandwidth,
        startDate: new Date(allocationForm.startDate),
        endDate: new Date(allocationForm.endDate),
        notes: allocationForm.notes,
      });
    } else {
      addAllocation({
        id: `alloc${Date.now()}`,
        developerId: allocationForm.developerId,
        projectId: allocationForm.projectId,
        bandwidth: allocationForm.bandwidth,
        startDate: new Date(allocationForm.startDate),
        endDate: new Date(allocationForm.endDate),
        notes: allocationForm.notes,
      });
    }
    closeAllocationModal();
  };

  // Unused but kept for potential future use
  // const handleDeleteAllocation = (allocation: Allocation) => {
  //   if (window.confirm('Are you sure you want to delete this allocation?')) {
  //     deleteAllocation(allocation.id);
  //   }
  // };

  const handleDelete = (project: Project) => {
    if (window.confirm(`Are you sure you want to delete ${project.name}? This will also remove all related allocations.`)) {
      deleteProject(project.id);
    }
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
          <button
            onClick={openAddProjectModal}
            className="px-4 py-2 text-sm bg-gradient-primary text-white hover:shadow-lg rounded-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </button>
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
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">{project.totalBandwidth}%</div>
                          {project.devsNeeded && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              project.totalBandwidth < 100 ? 'bg-yellow-100 text-yellow-700' :
                              project.totalBandwidth === 100 ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {project.totalBandwidth < 100 ? 'Under' :
                               project.totalBandwidth === 100 ? 'Full' :
                               'Over'}
                            </span>
                          )}
                        </div>
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
                          <button 
                            onClick={() => toggleRow(project.id)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditProjectModal(project)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            title="Edit project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openAddAllocationModal(project.id)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Add allocation"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(project)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-primary-600" />
                {editingProject ? 'Edit Project' : 'Add Project'}
              </h3>
              <button
                onClick={closeProjectModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleProjectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Project description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Skills (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={projectForm.requiredSkills}
                  onChange={(e) => setProjectForm({ ...projectForm, requiredSkills: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="React, TypeScript, Node.js"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={projectForm.priority}
                    onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as any })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
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
                  value={projectForm.devsNeeded}
                  onChange={(e) => setProjectForm({ ...projectForm, devsNeeded: e.target.value })}
                  placeholder="How many developers are needed?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-primary text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all"
                >
                  {editingProject ? 'Update Project' : 'Add Project'}
                </button>
                <button
                  type="button"
                  onClick={closeProjectModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary-600" />
                {editingAllocation ? 'Edit Allocation' : 'Add Allocation'}
              </h3>
              <button
                onClick={closeAllocationModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAllocationSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Developer *
                </label>
                <select
                  required
                  value={allocationForm.developerId}
                  onChange={(e) => setAllocationForm({ ...allocationForm, developerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a developer</option>
                  {developers.map(dev => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name} - {dev.skills.join(', ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project *
                </label>
                <select
                  required
                  value={allocationForm.projectId}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value);
                    setAllocationForm({ 
                      ...allocationForm, 
                      projectId: e.target.value,
                      endDate: project?.endDate 
                        ? formatDateInput(project.endDate)
                        : allocationForm.endDate
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a project</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bandwidth *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="50"
                      checked={allocationForm.bandwidth === 50}
                      onChange={() => setAllocationForm({ ...allocationForm, bandwidth: 50 })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Half-time (50%)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="100"
                      checked={allocationForm.bandwidth === 100}
                      onChange={() => setAllocationForm({ ...allocationForm, bandwidth: 100 })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Full-time (100%)</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={allocationForm.startDate}
                    onChange={(e) => setAllocationForm({ ...allocationForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={allocationForm.endDate}
                    onChange={(e) => setAllocationForm({ ...allocationForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={allocationForm.notes}
                  onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-primary text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all"
                >
                  {editingAllocation ? 'Update Allocation' : 'Add Allocation'}
                </button>
                <button
                  type="button"
                  onClick={closeAllocationModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectView;

