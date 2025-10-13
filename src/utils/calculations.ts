import { Allocation, Developer, Project } from '../types';
import { isAfter, isBefore } from 'date-fns';
import { getTodayStart } from './dateUtils';

export const calculateCurrentBandwidth = (allocations: Allocation[]): number => {
  const today = getTodayStart();
  
  return allocations
    .filter(a => isBefore(a.startDate, today) && isAfter(a.endDate, today))
    .reduce((sum, a) => sum + a.bandwidth, 0);
};

export const calculateAvailableBandwidth = (allocations: Allocation[]): number => {
  return 100 - calculateCurrentBandwidth(allocations);
};

export const calculateSkillMatch = (requiredSkills: string[], developerSkills: string[]): number => {
  if (requiredSkills.length === 0) return 100;
  
  const matchingSkills = requiredSkills.filter(skill => 
    developerSkills.some(devSkill => 
      devSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(devSkill.toLowerCase())
    )
  );
  
  return (matchingSkills.length / requiredSkills.length) * 100;
};

export const findAvailableDevelopers = (
  developers: Developer[],
  allocations: Allocation[],
  requiredBandwidth: number = 50,
  requiredSkills: string[] = []
): Array<{
  developer: Developer;
  availableBandwidth: number;
  availableFrom: Date;
  skillMatch: number;
}> => {
  const today = getTodayStart();
  
  return developers
    .map(developer => {
      const devAllocations = allocations.filter(a => a.developerId === developer.id);
      const currentBandwidth = calculateCurrentBandwidth(devAllocations);
      const availableBandwidth = 100 - currentBandwidth;
      
      // Find when developer has enough bandwidth
      let availableFrom = today;
      if (availableBandwidth < requiredBandwidth) {
        const futureAllocations = devAllocations
          .filter(a => isAfter(a.endDate, today))
          .sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
        
        for (const allocation of futureAllocations) {
          const bandwidthAfter = devAllocations
            .filter(a => isAfter(a.endDate, allocation.endDate))
            .reduce((sum, a) => sum + a.bandwidth, 0);
          
          if (100 - bandwidthAfter >= requiredBandwidth) {
            availableFrom = allocation.endDate;
            break;
          }
        }
      }
      
      const skillMatch = calculateSkillMatch(requiredSkills, developer.skills);
      
      return {
        developer,
        availableBandwidth: availableFrom.getTime() === today.getTime() ? availableBandwidth : 100,
        availableFrom,
        skillMatch,
      };
    })
    .filter(item => item.availableBandwidth >= requiredBandwidth || item.availableFrom > today)
    .sort((a, b) => {
      // Prioritize by skill match, then by availability date, then by available bandwidth
      if (b.skillMatch !== a.skillMatch) {
        return b.skillMatch - a.skillMatch;
      }
      if (a.availableFrom.getTime() !== b.availableFrom.getTime()) {
        return a.availableFrom.getTime() - b.availableFrom.getTime();
      }
      return b.availableBandwidth - a.availableBandwidth;
    });
};

