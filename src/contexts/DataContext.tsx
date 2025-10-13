import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Developer, Project, Allocation } from '../types';
import { sampleDevelopers, sampleProjects, sampleAllocations } from '../data/sampleData';

interface DataContextType {
  developers: Developer[];
  projects: Project[];
  allocations: Allocation[];
  addDeveloper: (developer: Developer) => void;
  updateDeveloper: (id: string, developer: Partial<Developer>) => void;
  deleteDeveloper: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addAllocation: (allocation: Allocation) => void;
  updateAllocation: (id: string, allocation: Partial<Allocation>) => void;
  deleteAllocation: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [developers, setDevelopers] = useState<Developer[]>(sampleDevelopers);
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [allocations, setAllocations] = useState<Allocation[]>(sampleAllocations);

  const addDeveloper = (developer: Developer) => {
    setDevelopers([...developers, developer]);
  };

  const updateDeveloper = (id: string, updatedDeveloper: Partial<Developer>) => {
    setDevelopers(developers.map(dev => 
      dev.id === id ? { ...dev, ...updatedDeveloper } : dev
    ));
  };

  const deleteDeveloper = (id: string) => {
    setDevelopers(developers.filter(dev => dev.id !== id));
    setAllocations(allocations.filter(alloc => alloc.developerId !== id));
  };

  const addProject = (project: Project) => {
    setProjects([...projects, project]);
  };

  const updateProject = (id: string, updatedProject: Partial<Project>) => {
    setProjects(projects.map(proj => 
      proj.id === id ? { ...proj, ...updatedProject } : proj
    ));
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(proj => proj.id !== id));
    setAllocations(allocations.filter(alloc => alloc.projectId !== id));
  };

  const addAllocation = (allocation: Allocation) => {
    setAllocations([...allocations, allocation]);
  };

  const updateAllocation = (id: string, updatedAllocation: Partial<Allocation>) => {
    setAllocations(allocations.map(alloc => 
      alloc.id === id ? { ...alloc, ...updatedAllocation } : alloc
    ));
  };

  const deleteAllocation = (id: string) => {
    setAllocations(allocations.filter(alloc => alloc.id !== id));
  };

  return (
    <DataContext.Provider value={{
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

