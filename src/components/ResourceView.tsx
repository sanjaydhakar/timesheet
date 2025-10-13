import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { DeveloperWithAllocations } from '../types';
import { calculateCurrentBandwidth } from '../utils/calculations';
import { formatDate, getTodayStart, getNextAvailableDate } from '../utils/dateUtils';
import { User, Calendar, TrendingUp, Filter } from 'lucide-react';
import { isAfter, isBefore } from 'date-fns';

const ResourceView: React.FC = () => {
  const { developers, projects, allocations } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  const developersWithAllocations: DeveloperWithAllocations[] = useMemo(() => {
    const today = getTodayStart();

    return developers.map(developer => {
      const devAllocations = allocations
        .filter(a => a.developerId === developer.id)
        .map(allocation => ({
          ...allocation,
          project: projects.find(p => p.id === allocation.projectId)!,
        }));

      const currentBandwidth = calculateCurrentBandwidth(devAllocations);
      const nextAvailableDate = getNextAvailableDate(devAllocations);

      return {
        ...developer,
        allocations: devAllocations,
        currentBandwidth,
        nextAvailableDate,
      };
    });
  }, [developers, projects, allocations]);

  const filteredDevelopers = useMemo(() => {
    return developersWithAllocations
      .filter(dev => {
        const matchesSearch = dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             dev.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSkill = !skillFilter || dev.skills.some(skill => 
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        );
        return matchesSearch && matchesSkill;
      })
      .sort((a, b) => {
        // Sort by current bandwidth (most busy first, then by name)
        if (b.currentBandwidth !== a.currentBandwidth) {
          return b.currentBandwidth - a.currentBandwidth;
        }
        return a.name.localeCompare(b.name);
      });
  }, [developersWithAllocations, searchTerm, skillFilter]);

  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    developers.forEach(dev => dev.skills.forEach(skill => skills.add(skill)));
    return Array.from(skills).sort();
  }, [developers]);

  const getBandwidthColor = (bandwidth: number) => {
    if (bandwidth >= 100) return 'text-red-600 bg-red-50';
    if (bandwidth >= 75) return 'text-orange-600 bg-orange-50';
    if (bandwidth >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const today = getTodayStart();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search developers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Skills</option>
            {allSkills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredDevelopers.map(developer => (
          <div key={developer.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{developer.name}</h3>
                  <p className="text-sm text-gray-600">{developer.email}</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full font-semibold ${getBandwidthColor(developer.currentBandwidth)}`}>
                {developer.currentBandwidth}% Allocated
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Skills:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {developer.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Availability:</span>
              </div>
              {developer.currentBandwidth < 100 ? (
                <p className="text-sm text-green-600 font-medium">
                  Available now ({100 - developer.currentBandwidth}% bandwidth free)
                </p>
              ) : developer.nextAvailableDate ? (
                <p className="text-sm text-orange-600 font-medium">
                  Next available: {formatDate(developer.nextAvailableDate)}
                </p>
              ) : (
                <p className="text-sm text-gray-600">Fully allocated</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Assignments:</h4>
              {developer.allocations.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No active assignments</p>
              ) : (
                <div className="space-y-2">
                  {developer.allocations
                    .filter(alloc => isAfter(alloc.endDate, today))
                    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                    .map(allocation => {
                      const isActive = isBefore(allocation.startDate, today);
                      return (
                        <div key={allocation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-gray-900">{allocation.project.name}</h5>
                              {isActive ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Upcoming</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(allocation.startDate)} → {formatDate(allocation.endDate)}
                            </p>
                            {allocation.notes && (
                              <p className="text-sm text-gray-500 italic mt-1">{allocation.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-primary-600">{allocation.bandwidth}%</div>
                            <div className="text-xs text-gray-500">Bandwidth</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceView;

