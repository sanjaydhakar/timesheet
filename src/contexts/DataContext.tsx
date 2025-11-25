import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Developer, Project, Allocation } from '../types';
import { developersApi, projectsApi, allocationsApi } from '../services/api';
import { useAuth } from './AuthContext';

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
  refreshSelective: (dataTypes: ('developers' | 'projects' | 'allocations')[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const prevTeamIdRef = React.useRef<string | undefined>();

  // Fetch all data on mount
  const fetchData = async () => {
    if (!user || !user.currentTeamId) {
      setLoading(false);
      return;
    }

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

  // Fetch only specific data types - memoized to prevent unnecessary re-renders
  const fetchSelective = useCallback(async (dataTypes: ('developers' | 'projects' | 'allocations')[]) => {
    if (!user || !user.currentTeamId) {
      return;
    }

    console.log('📡 fetchSelective called with:', dataTypes, 'user:', user.id);

    try {
      setLoading(true);
      setError(null);
      
      const promises: Promise<any>[] = [];
      const types: string[] = [];

      if (dataTypes.includes('developers')) {
        console.log('  → Fetching developers');
        promises.push(developersApi.getAll());
        types.push('developers');
      }
      if (dataTypes.includes('projects')) {
        console.log('  → Fetching projects');
        promises.push(projectsApi.getAll());
        types.push('projects');
      }
      if (dataTypes.includes('allocations')) {
        console.log('  → Fetching allocations');
        promises.push(allocationsApi.getAll());
        types.push('allocations');
      }

      const results = await Promise.all(promises);
      
      results.forEach((data, index) => {
        const type = types[index];
        if (type === 'developers') setDevelopers(data);
        if (type === 'projects') setProjects(data);
        if (type === 'allocations') setAllocations(data);
      });
    } catch (err: any) {
      console.error('Error fetching selective data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle initial mount and team changes
  useEffect(() => {
    if (isInitialMount) {
      // On initial mount, just set loading to false
      // Let App.tsx handle the initial data fetch based on the current tab
      setIsInitialMount(false);
      setLoading(false);
      prevTeamIdRef.current = user?.currentTeamId;
    } else if (user?.currentTeamId && prevTeamIdRef.current !== user?.currentTeamId) {
      // Only fetch when team actually changes (not just when user object updates)
      console.log('🔄 Team changed from', prevTeamIdRef.current, 'to', user?.currentTeamId);
      prevTeamIdRef.current = user?.currentTeamId;
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.currentTeamId, isInitialMount]); // fetchData intentionally omitted to prevent loops

  const addDeveloper = async (developer: Developer) => {
    try {
      const newDev = await developersApi.create(developer, user?.currentTeamId);
      setDevelopers([...developers, newDev]);
    } catch (err: any) {
      console.error('Error adding developer:', err);
      throw err;
    }
  };

  const updateDeveloper = async (id: string, updatedDeveloper: Partial<Developer>) => {
    try {
      const updated = await developersApi.update(id, updatedDeveloper, user?.currentTeamId);
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
      const newProj = await projectsApi.create(project, user?.currentTeamId);
      setProjects([...projects, newProj]);
    } catch (err: any) {
      console.error('Error adding project:', err);
      throw err;
    }
  };

  const updateProject = async (id: string, updatedProject: Partial<Project>) => {
    try {
      const updated = await projectsApi.update(id, updatedProject, user?.currentTeamId);
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
      const newAlloc = await allocationsApi.create(allocation, user?.currentTeamId);
      setAllocations([...allocations, newAlloc]);
    } catch (err: any) {
      console.error('Error adding allocation:', err);
      throw err;
    }
  };

  const updateAllocation = async (id: string, updatedAllocation: Partial<Allocation>) => {
    try {
      const updated = await allocationsApi.update(id, updatedAllocation, user?.currentTeamId);
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
      refreshSelective: fetchSelective,
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
