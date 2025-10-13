import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Developer, Project, Allocation } from '../types';
import { Plus, Edit2, Trash2, User, Briefcase, Calendar, X, Upload } from 'lucide-react';
import { formatDateInput, formatDate } from '../utils/dateUtils';
import BulkAddDevelopers from './BulkAddDevelopers';

type ModalType = 'developer' | 'project' | 'allocation' | null;

const ManageData: React.FC = () => {
  const {
    developers,
    projects,
    allocations,
    addDeveloper,
    updateDeveloper,
    deleteDeveloper,
    addProject,
    updateProject,
    deleteProject,
    addAllocation,
    updateAllocation,
    deleteAllocation,
  } = useData();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'developers' | 'projects' | 'allocations'>('developers');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [returnToAllocationModal, setReturnToAllocationModal] = useState(false);

  // Developer form state
  const [developerForm, setDeveloperForm] = useState({
    name: '',
    email: '',
    skills: '',
  });

  // Project form state
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    requiredSkills: '',
    priority: 'medium' as const,
    status: 'planning' as const,
    startDate: '',
    endDate: '',
  });

  // Allocation form state
  const [allocationForm, setAllocationForm] = useState({
    developerId: '',
    projectId: '',
    bandwidth: 100 as 50 | 100,
    startDate: formatDateInput(new Date()),
    endDate: formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    notes: '',
  });

  const openDeveloperModal = (developer?: Developer, fromAllocationForm: boolean = false) => {
    if (developer) {
      setEditingId(developer.id);
      setDeveloperForm({
        name: developer.name,
        email: developer.email,
        skills: developer.skills.join(', '),
      });
    } else {
      setEditingId(null);
      setDeveloperForm({ name: '', email: '', skills: '' });
    }
    setReturnToAllocationModal(fromAllocationForm);
    setActiveModal('developer');
  };

  const openProjectModal = (project?: Project, fromAllocationForm: boolean = false) => {
    if (project) {
      setEditingId(project.id);
      setProjectForm({
        name: project.name,
        description: project.description,
        requiredSkills: project.requiredSkills.join(', '),
        priority: project.priority,
        status: project.status,
        startDate: project.startDate ? formatDateInput(project.startDate) : '',
        endDate: project.endDate ? formatDateInput(project.endDate) : '',
      });
    } else {
      setEditingId(null);
      setProjectForm({
        name: '',
        description: '',
        requiredSkills: '',
        priority: 'medium',
        status: 'planning',
        startDate: '',
        endDate: '',
      });
    }
    setReturnToAllocationModal(fromAllocationForm);
    setActiveModal('project');
  };

  const openAllocationModal = (allocation?: Allocation) => {
    if (allocation) {
      setEditingId(allocation.id);
      setAllocationForm({
        developerId: allocation.developerId,
        projectId: allocation.projectId,
        bandwidth: allocation.bandwidth as 50 | 100,
        startDate: formatDateInput(allocation.startDate),
        endDate: formatDateInput(allocation.endDate),
        notes: allocation.notes || '',
      });
    } else {
      setEditingId(null);
      const firstProjectId = projects[0]?.id || '';
      const firstProject = projects.find(p => p.id === firstProjectId);
      
      setAllocationForm({
        developerId: developers[0]?.id || '',
        projectId: firstProjectId,
        bandwidth: 100,
        startDate: formatDateInput(new Date()),
        endDate: firstProject?.endDate 
          ? formatDateInput(firstProject.endDate)
          : formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        notes: '',
      });
    }
    setActiveModal('allocation');
  };

  const closeModal = () => {
    if (returnToAllocationModal) {
      setReturnToAllocationModal(false);
      setActiveModal('allocation');
    } else {
      setActiveModal(null);
    }
    setEditingId(null);
  };

  const handleDeveloperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = developerForm.skills.split(',').map(s => s.trim()).filter(s => s);
    
    if (editingId) {
      updateDeveloper(editingId, { ...developerForm, skills });
    } else {
      const newId = `dev${Date.now()}`;
      addDeveloper({
        id: newId,
        name: developerForm.name,
        email: developerForm.email,
        skills,
      });
      // If returning to allocation modal, select the newly created developer
      if (returnToAllocationModal) {
        setAllocationForm({ ...allocationForm, developerId: newId });
      }
    }
    closeModal();
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
    };
    
    if (editingId) {
      updateProject(editingId, projectData);
    } else {
      const newId = `proj${Date.now()}`;
      addProject({
        id: newId,
        ...projectData,
      });
      // If returning to allocation modal, select the newly created project and prefill end date
      if (returnToAllocationModal) {
        setAllocationForm({ 
          ...allocationForm, 
          projectId: newId,
          endDate: projectData.endDate ? formatDateInput(projectData.endDate) : allocationForm.endDate
        });
      }
    }
    closeModal();
  };

  const handleAllocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allocationData = {
      developerId: allocationForm.developerId,
      projectId: allocationForm.projectId,
      bandwidth: allocationForm.bandwidth,
      startDate: new Date(allocationForm.startDate),
      endDate: new Date(allocationForm.endDate),
      notes: allocationForm.notes,
    };
    
    if (editingId) {
      updateAllocation(editingId, allocationData);
    } else {
      addAllocation({
        id: `alloc${Date.now()}`,
        ...allocationData,
      });
    }
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('developers')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'developers'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Developers
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'projects'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'allocations'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Allocations
        </button>
      </div>

      {/* Developers Tab */}
      {activeTab === 'developers' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => openDeveloperModal()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Developer
            </button>
            <button
              onClick={() => setShowBulkImport(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Bulk Import
            </button>
          </div>
          <div className="grid gap-4">
            {developers
              .slice()
              .sort((a, b) => {
                // Calculate current bandwidth for sorting
                const bandwidthA = allocations
                  .filter(alloc => alloc.developerId === a.id)
                  .reduce((sum, alloc) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const start = new Date(alloc.startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(alloc.endDate);
                    end.setHours(0, 0, 0, 0);
                    if (start <= today && end >= today) {
                      return sum + alloc.bandwidth;
                    }
                    return sum;
                  }, 0);
                
                const bandwidthB = allocations
                  .filter(alloc => alloc.developerId === b.id)
                  .reduce((sum, alloc) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const start = new Date(alloc.startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(alloc.endDate);
                    end.setHours(0, 0, 0, 0);
                    if (start <= today && end >= today) {
                      return sum + alloc.bandwidth;
                    }
                    return sum;
                  }, 0);
                
                // Sort by bandwidth (most busy first), then by name
                if (bandwidthB !== bandwidthA) {
                  return bandwidthB - bandwidthA;
                }
                return a.name.localeCompare(b.name);
              })
              .map(developer => (
              <div key={developer.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-primary-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{developer.name}</h4>
                    <p className="text-sm text-gray-600">{developer.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {developer.skills.map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openDeveloperModal(developer)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${developer.name}?`)) deleteDeveloper(developer.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <button
            onClick={() => openProjectModal()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Project
          </button>
          <div className="grid gap-4">
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-lg shadow p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-8 h-8 text-primary-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                    <div className="flex gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {project.status}
                      </span>
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                        {project.priority}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.requiredSkills.map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openProjectModal(project)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${project.name}?`)) deleteProject(project.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allocations Tab */}
      {activeTab === 'allocations' && (
        <div className="space-y-4">
          <button
            onClick={() => openAllocationModal()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Allocation
          </button>
          <div className="grid gap-4">
            {allocations.map(allocation => {
              const developer = developers.find(d => d.id === allocation.developerId);
              const project = projects.find(p => p.id === allocation.projectId);
              return (
                <div key={allocation.id} className="bg-white rounded-lg shadow p-4 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-8 h-8 text-primary-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {developer?.name} → {project?.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(allocation.startDate)} to {formatDate(allocation.endDate)}
                      </p>
                      <p className="text-sm font-medium text-primary-600 mt-1">
                        Bandwidth: {allocation.bandwidth}%
                      </p>
                      {allocation.notes && (
                        <p className="text-sm text-gray-500 italic mt-1">{allocation.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openAllocationModal(allocation)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this allocation?')) deleteAllocation(allocation.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Developer Modal */}
      {activeModal === 'developer' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Developer' : 'Add Developer'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleDeveloperSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={developerForm.name}
                  onChange={(e) => setDeveloperForm({ ...developerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={developerForm.email}
                  onChange={(e) => setDeveloperForm({ ...developerForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={developerForm.skills}
                  onChange={(e) => setDeveloperForm({ ...developerForm, skills: e.target.value })}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {activeModal === 'project' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Project' : 'Add Project'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={projectForm.requiredSkills}
                  onChange={(e) => setProjectForm({ ...projectForm, requiredSkills: e.target.value })}
                  placeholder="React, Backend, Security"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={projectForm.priority}
                    onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {activeModal === 'allocation' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Allocation' : 'Add Allocation'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAllocationSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Developer</label>
                  <button
                    type="button"
                    onClick={() => openDeveloperModal(undefined, true)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add New
                  </button>
                </div>
                <select
                  required
                  value={allocationForm.developerId}
                  onChange={(e) => setAllocationForm({ ...allocationForm, developerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {developers.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Project</label>
                  <button
                    type="button"
                    onClick={() => openProjectModal(undefined, true)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add New
                  </button>
                </div>
                <select
                  required
                  value={allocationForm.projectId}
                  onChange={(e) => {
                    const selectedProject = projects.find(p => p.id === e.target.value);
                    setAllocationForm({ 
                      ...allocationForm, 
                      projectId: e.target.value,
                      endDate: selectedProject?.endDate 
                        ? formatDateInput(selectedProject.endDate)
                        : allocationForm.endDate
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bandwidth Allocation
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bandwidth"
                      value="50"
                      checked={allocationForm.bandwidth === 50}
                      onChange={() => setAllocationForm({ ...allocationForm, bandwidth: 50 })}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">50% (Half-time)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bandwidth"
                      value="100"
                      checked={allocationForm.bandwidth === 100}
                      onChange={() => setAllocationForm({ ...allocationForm, bandwidth: 100 })}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">100% (Full-time)</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={allocationForm.startDate}
                    onChange={(e) => setAllocationForm({ ...allocationForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={allocationForm.endDate}
                    onChange={(e) => setAllocationForm({ ...allocationForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={allocationForm.notes}
                  onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkAddDevelopers onClose={() => setShowBulkImport(false)} />
      )}
    </div>
  );
};

export default ManageData;

