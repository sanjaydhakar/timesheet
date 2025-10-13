import { Developer, Project, Allocation } from '../types';

export const sampleDevelopers: Developer[] = [
  {
    id: 'dev1',
    name: 'Alice Johnson',
    email: 'alice@company.com',
    skills: ['React', 'TypeScript', 'Node.js', 'Homepage'],
  },
  {
    id: 'dev2',
    name: 'Bob Smith',
    email: 'bob@company.com',
    skills: ['Vue.js', 'Python', 'Django', 'Backend'],
  },
  {
    id: 'dev3',
    name: 'Carol Williams',
    email: 'carol@company.com',
    skills: ['React', 'GraphQL', 'AWS', 'Homepage', 'Mobile'],
  },
  {
    id: 'dev4',
    name: 'David Brown',
    email: 'david@company.com',
    skills: ['Angular', 'Java', 'Spring Boot', 'Microservices'],
  },
  {
    id: 'dev5',
    name: 'Emma Davis',
    email: 'emma@company.com',
    skills: ['React', 'TypeScript', 'Testing', 'CI/CD'],
  },
];

export const sampleProjects: Project[] = [
  {
    id: 'proj1',
    name: 'Homepage Redesign',
    description: 'Complete overhaul of the company homepage',
    requiredSkills: ['React', 'Homepage', 'TypeScript'],
    priority: 'critical',
    status: 'active',
  },
  {
    id: 'proj2',
    name: 'Mobile App Backend',
    description: 'Build scalable backend for mobile application',
    requiredSkills: ['Node.js', 'Backend', 'Mobile'],
    priority: 'high',
    status: 'active',
  },
  {
    id: 'proj3',
    name: 'Payment Gateway Integration',
    description: 'Integrate new payment provider',
    requiredSkills: ['Backend', 'Security'],
    priority: 'critical',
    status: 'planning',
  },
  {
    id: 'proj4',
    name: 'Analytics Dashboard',
    description: 'Build internal analytics dashboard',
    requiredSkills: ['React', 'Data Visualization'],
    priority: 'medium',
    status: 'planning',
  },
  {
    id: 'proj5',
    name: 'User Authentication Upgrade',
    description: 'Modernize authentication system',
    requiredSkills: ['Backend', 'Security', 'Microservices'],
    priority: 'high',
    status: 'active',
  },
];

const today = new Date();
const getDateOffset = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date;
};

export const sampleAllocations: Allocation[] = [
  // Alice on Homepage Redesign (100% for 60 days)
  {
    id: 'alloc1',
    developerId: 'dev1',
    projectId: 'proj1',
    bandwidth: 100,
    startDate: getDateOffset(-10),
    endDate: getDateOffset(50),
    notes: 'Lead developer - Full-time',
  },
  // Carol on Homepage Redesign (50% for 60 days)
  {
    id: 'alloc2',
    developerId: 'dev3',
    projectId: 'proj1',
    bandwidth: 50,
    startDate: getDateOffset(-10),
    endDate: getDateOffset(50),
    notes: 'UI/UX focus - Half-time',
  },
  // Bob on Mobile App Backend (100% for 90 days)
  {
    id: 'alloc3',
    developerId: 'dev2',
    projectId: 'proj2',
    bandwidth: 100,
    startDate: getDateOffset(-5),
    endDate: getDateOffset(85),
    notes: 'Backend lead - Full-time',
  },
  // Carol on Mobile App Backend (50% for 45 days)
  {
    id: 'alloc4',
    developerId: 'dev3',
    projectId: 'proj2',
    bandwidth: 50,
    startDate: getDateOffset(0),
    endDate: getDateOffset(45),
    notes: 'Mobile expertise consultant - Half-time',
  },
  // David on User Authentication (100% for 75 days)
  {
    id: 'alloc5',
    developerId: 'dev4',
    projectId: 'proj5',
    bandwidth: 100,
    startDate: getDateOffset(-15),
    endDate: getDateOffset(60),
    notes: 'Microservices expert - Full-time',
  },
  // Emma on User Authentication (50% for 75 days)
  {
    id: 'alloc6',
    developerId: 'dev5',
    projectId: 'proj5',
    bandwidth: 50,
    startDate: getDateOffset(-15),
    endDate: getDateOffset(60),
    notes: 'Testing and QA - Half-time',
  },
];

