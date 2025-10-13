import { Developer, Project, Allocation } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Developers API
export const developersApi = {
  getAll: async (): Promise<Developer[]> => {
    const response = await fetch(`${API_BASE_URL}/developers`);
    return handleResponse<Developer[]>(response);
  },

  getById: async (id: string): Promise<Developer> => {
    const response = await fetch(`${API_BASE_URL}/developers/${id}`);
    return handleResponse<Developer>(response);
  },

  create: async (developer: Developer): Promise<Developer> => {
    const response = await fetch(`${API_BASE_URL}/developers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(developer),
    });
    return handleResponse<Developer>(response);
  },

  update: async (id: string, developer: Partial<Developer>): Promise<Developer> => {
    const response = await fetch(`${API_BASE_URL}/developers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(developer),
    });
    return handleResponse<Developer>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/developers/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
};

// Projects API
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE_URL}/projects`);
    const data = await handleResponse<any[]>(response);
    // Transform snake_case to camelCase
    return data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      requiredSkills: item.required_skills || [],
      priority: item.priority,
      status: item.status,
    }));
  },

  getById: async (id: string): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    const data = await handleResponse<any>(response);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      requiredSkills: data.required_skills || [],
      priority: data.priority,
      status: data.status,
    };
  },

  create: async (project: Project): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: project.id,
        name: project.name,
        description: project.description,
        required_skills: project.requiredSkills,
        priority: project.priority,
        status: project.status,
      }),
    });
    const data = await handleResponse<any>(response);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      requiredSkills: data.required_skills || [],
      priority: data.priority,
      status: data.status,
    };
  },

  update: async (id: string, project: Partial<Project>): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: project.name,
        description: project.description,
        required_skills: project.requiredSkills,
        priority: project.priority,
        status: project.status,
      }),
    });
    const data = await handleResponse<any>(response);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      requiredSkills: data.required_skills || [],
      priority: data.priority,
      status: data.status,
    };
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
};

// Allocations API
export const allocationsApi = {
  getAll: async (): Promise<Allocation[]> => {
    const response = await fetch(`${API_BASE_URL}/allocations`);
    const data = await handleResponse<any[]>(response);
    // Convert date strings to Date objects
    return data.map(item => ({
      ...item,
      startDate: new Date(item.start_date),
      endDate: new Date(item.end_date),
      developerId: item.developer_id,
      projectId: item.project_id,
    }));
  },

  getByDeveloper: async (developerId: string): Promise<Allocation[]> => {
    const response = await fetch(`${API_BASE_URL}/allocations/developer/${developerId}`);
    const data = await handleResponse<any[]>(response);
    return data.map(item => ({
      ...item,
      startDate: new Date(item.start_date),
      endDate: new Date(item.end_date),
      developerId: item.developer_id,
      projectId: item.project_id,
    }));
  },

  getByProject: async (projectId: string): Promise<Allocation[]> => {
    const response = await fetch(`${API_BASE_URL}/allocations/project/${projectId}`);
    const data = await handleResponse<any[]>(response);
    return data.map(item => ({
      ...item,
      startDate: new Date(item.start_date),
      endDate: new Date(item.end_date),
      developerId: item.developer_id,
      projectId: item.project_id,
    }));
  },

  create: async (allocation: Allocation): Promise<Allocation> => {
    const response = await fetch(`${API_BASE_URL}/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: allocation.id,
        developer_id: allocation.developerId,
        project_id: allocation.projectId,
        bandwidth: allocation.bandwidth,
        start_date: allocation.startDate.toISOString().split('T')[0],
        end_date: allocation.endDate.toISOString().split('T')[0],
        notes: allocation.notes,
      }),
    });
    const data = await handleResponse<any>(response);
    return {
      ...data,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      developerId: data.developer_id,
      projectId: data.project_id,
    };
  },

  update: async (id: string, allocation: Partial<Allocation>): Promise<Allocation> => {
    const response = await fetch(`${API_BASE_URL}/allocations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        developer_id: allocation.developerId,
        project_id: allocation.projectId,
        bandwidth: allocation.bandwidth,
        start_date: allocation.startDate ? allocation.startDate.toISOString().split('T')[0] : undefined,
        end_date: allocation.endDate ? allocation.endDate.toISOString().split('T')[0] : undefined,
        notes: allocation.notes,
      }),
    });
    const data = await handleResponse<any>(response);
    return {
      ...data,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      developerId: data.developer_id,
      projectId: data.project_id,
    };
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/allocations/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
};

