import { Developer, Project, Allocation } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  const currentTeamId = localStorage.getItem('current_team_id');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (currentTeamId) {
    headers['x-current-team-id'] = currentTeamId;
  }
  
  return headers;
}

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
    const response = await fetch(`${API_BASE_URL}/developers`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Developer[]>(response);
  },

  getById: async (id: string): Promise<Developer> => {
    const response = await fetch(`${API_BASE_URL}/developers/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Developer>(response);
  },

  create: async (developer: Developer, teamId?: string): Promise<Developer> => {
    const response = await fetch(`${API_BASE_URL}/developers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...developer, teamId }),
    });
    return handleResponse<Developer>(response);
  },

  update: async (id: string, developer: Partial<Developer>, teamId?: string): Promise<Developer> => {
    const response = await fetch(`${API_BASE_URL}/developers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...developer, teamId }),
    });
    return handleResponse<Developer>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/developers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleResponse(response);
  },
};

// Projects API
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<any[]>(response);
    // Transform snake_case to camelCase
    return data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      requiredSkills: item.required_skills || [],
      priority: item.priority,
      status: item.status,
      startDate: item.start_date ? new Date(item.start_date) : undefined,
      endDate: item.end_date ? new Date(item.end_date) : undefined,
      devsNeeded: item.devs_needed,
    }));
  },

  getById: async (id: string): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<any>(response);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      requiredSkills: data.required_skills || [],
      priority: data.priority,
      status: data.status,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      devsNeeded: data.devs_needed,
    };
  },

  create: async (project: Project, teamId?: string): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: project.id,
        name: project.name,
        description: project.description,
        required_skills: project.requiredSkills,
        priority: project.priority,
        status: project.status,
        start_date: project.startDate ? project.startDate.toISOString().split('T')[0] : null,
        end_date: project.endDate ? project.endDate.toISOString().split('T')[0] : null,
        devs_needed: project.devsNeeded,
        teamId,
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
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      devsNeeded: data.devs_needed,
    };
  },

  update: async (id: string, project: Partial<Project>, teamId?: string): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: project.name,
        description: project.description,
        required_skills: project.requiredSkills,
        priority: project.priority,
        status: project.status,
        start_date: project.startDate ? project.startDate.toISOString().split('T')[0] : null,
        end_date: project.endDate ? project.endDate.toISOString().split('T')[0] : null,
        devs_needed: project.devsNeeded,
        teamId,
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
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      devsNeeded: data.devs_needed,
    };
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleResponse(response);
  },
};

// Allocations API
export const allocationsApi = {
  getAll: async (): Promise<Allocation[]> => {
    const response = await fetch(`${API_BASE_URL}/allocations`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<any[]>(response);
    // Convert date strings to Date objects
    return data.map(item => ({
      ...item,
      startDate: new Date(item.start_date),
      endDate: new Date(item.end_date),
      developerId: item.developer_id,
      projectId: item.project_id,
      createdAt: item.created_at ? new Date(item.created_at) : undefined,
      createdBy: item.created_by,
      createdByName: item.created_by_name,
      createdByEmail: item.created_by_email,
    }));
  },

  getByDeveloper: async (developerId: string): Promise<Allocation[]> => {
    const response = await fetch(`${API_BASE_URL}/allocations/developer/${developerId}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<any[]>(response);
    return data.map(item => ({
      ...item,
      startDate: new Date(item.start_date),
      endDate: new Date(item.end_date),
      developerId: item.developer_id,
      projectId: item.project_id,
      createdAt: item.created_at ? new Date(item.created_at) : undefined,
    }));
  },

  getByProject: async (projectId: string): Promise<Allocation[]> => {
    const response = await fetch(`${API_BASE_URL}/allocations/project/${projectId}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<any[]>(response);
    return data.map(item => ({
      ...item,
      startDate: new Date(item.start_date),
      endDate: new Date(item.end_date),
      developerId: item.developer_id,
      projectId: item.project_id,
      createdAt: item.created_at ? new Date(item.created_at) : undefined,
    }));
  },

  create: async (allocation: Allocation, teamId?: string): Promise<Allocation> => {
    const response = await fetch(`${API_BASE_URL}/allocations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: allocation.id,
        developer_id: allocation.developerId,
        project_id: allocation.projectId,
        bandwidth: allocation.bandwidth,
        start_date: allocation.startDate.toISOString().split('T')[0],
        end_date: allocation.endDate.toISOString().split('T')[0],
        notes: allocation.notes,
        teamId,
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

  update: async (id: string, allocation: Partial<Allocation>, teamId?: string): Promise<Allocation> => {
    const response = await fetch(`${API_BASE_URL}/allocations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        developer_id: allocation.developerId,
        project_id: allocation.projectId,
        bandwidth: allocation.bandwidth,
        start_date: allocation.startDate ? allocation.startDate.toISOString().split('T')[0] : undefined,
        end_date: allocation.endDate ? allocation.endDate.toISOString().split('T')[0] : undefined,
        notes: allocation.notes,
        teamId,
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
      headers: getAuthHeaders(),
    });
    await handleResponse(response);
  },
};

