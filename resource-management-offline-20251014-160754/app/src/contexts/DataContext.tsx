import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Developer, Project, Allocation } from '../types';
import { developersApi, projectsApi, allocationsApi } from '../services/api';

interface DataContextType {
  developers: Developer[];
  projects: Project[];
  allocations: Allocation[];
  loading: boolean;
  error: string | null;
  addDeveloper: (developer: Developer) => Promise<void>;
  updateDeveloper: (id: string, developer: Partial<Developer>) => Promise<void>;
  deleteDeveloper: (id: string) => Promise<void>;
  addProject: (project: Project) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addAllocation: (allocation: Allocation) => Promise<void>;
  updateAllocation: (id: string, allocation: Partial<Allocation>) => Promise<void>;
  deleteAllocation: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on mount
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [devsData, projsData, allocsData] = await Promise.all([
        developersApi.getAll(),
        projectsApi.getAll(),
        allocationsApi.getAll(),
      ]);
      
      setDevelopers(devsData);
      setProjects(projsData);
      setAllocations(allocsData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addDeveloper = async (developer: Developer) => {
    try {
      const newDev = await developersApi.create(developer);
      setDevelopers([...developers, newDev]);
    } catch (err: any) {
      console.error('Error adding developer:', err);
      throw err;
    }
  };

  const updateDeveloper = async (id: string, updatedDeveloper: Partial<Developer>) => {
    try {
      const updated = await developersApi.update(id, updatedDeveloper);
      setDevelopers(developers.map(dev => 
        dev.id === id ? updated : dev
      ));
    } catch (err: any) {
      console.error('Error updating developer:', err);
      throw err;
    }
  };

  const deleteDeveloper = async (id: string) => {
    try {
      await developersApi.delete(id);
      setDevelopers(developers.filter(dev => dev.id !== id));
      setAllocations(allocations.filter(alloc => alloc.developerId !== id));
    } catch (err: any) {
      console.error('Error deleting developer:', err);
      throw err;
    }
  };

  const addProject = async (project: Project) => {
    try {
      const newProj = await projectsApi.create(project);
      setProjects([...projects, newProj]);
    } catch (err: any) {
      console.error('Error adding project:', err);
      throw err;
    }
  };

  const updateProject = async (id: string, updatedProject: Partial<Project>) => {
    try {
      const updated = await projectsApi.update(id, updatedProject);
      setProjects(projects.map(proj => 
        proj.id === id ? updated : proj
      ));
    } catch (err: any) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectsApi.delete(id);
      setProjects(projects.filter(proj => proj.id !== id));
      setAllocations(allocations.filter(alloc => alloc.projectId !== id));
    } catch (err: any) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  const addAllocation = async (allocation: Allocation) => {
    try {
      const newAlloc = await allocationsApi.create(allocation);
      setAllocations([...allocations, newAlloc]);
    } catch (err: any) {
      console.error('Error adding allocation:', err);
      throw err;
    }
  };

  const updateAllocation = async (id: string, updatedAllocation: Partial<Allocation>) => {
    try {
      const updated = await allocationsApi.update(id, updatedAllocation);
      setAllocations(allocations.map(alloc => 
        alloc.id === id ? updated : alloc
      ));
    } catch (err: any) {
      console.error('Error updating allocation:', err);
      throw err;
    }
  };

  const deleteAllocation = async (id: string) => {
    try {
      await allocationsApi.delete(id);
      setAllocations(allocations.filter(alloc => alloc.id !== id));
    } catch (err: any) {
      console.error('Error deleting allocation:', err);
      throw err;
    }
  };

  return (
    <DataContext.Provider value={{
      developers,
      projects,
      allocations,
      loading,
      error,
      addDeveloper,
      updateDeveloper,
      deleteDeveloper,
      addProject,
      updateProject,
      deleteProject,
      addAllocation,
      updateAllocation,
      deleteAllocation,
      refreshData: fetchData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
