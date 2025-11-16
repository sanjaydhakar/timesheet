export interface Team {
  id: string;
  name: string;
  description?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface Developer {
  id: string;
  name: string;
  email: string;
  skills: string[];
  avatar?: string;
  teamId?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  requiredSkills: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  startDate?: Date;
  endDate?: Date;
  devsNeeded?: number;
  teamId?: string;
}

export interface Allocation {
  id: string;
  developerId: string;
  projectId: string;
  bandwidth: number; // 0-100 percentage
  startDate: Date;
  endDate: Date;
  notes?: string;
  teamId?: string;
  createdBy?: string;
  createdByName?: string;
  createdByEmail?: string;
  createdAt?: Date;
}

export interface DeveloperWithAllocations extends Developer {
  allocations: (Allocation & { project: Project })[];
  currentBandwidth: number;
  nextAvailableDate: Date | null;
}

export interface ProjectWithAllocations extends Project {
  allocations: (Allocation & { developer: Developer })[];
  totalBandwidth: number;
  estimatedCompletion: Date | null;
}

export type ViewMode = 'resources' | 'projects';

export interface AvailabilityWindow {
  developerId: string;
  developerName: string;
  availableFrom: Date;
  bandwidth: number;
  skills: string[];
}

