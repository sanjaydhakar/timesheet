import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { DeveloperWithAllocations } from '../types';
import { calculateCurrentBandwidth } from '../utils/calculations';
import { formatDate, getTodayStart, getNextAvailableDate } from '../utils/dateUtils';
import { User, Calendar, TrendingUp, Filter, ChevronDown, ChevronRight, Edit2, Eye, Plus, Search } from 'lucide-react';
import { isAfter, isBefore } from 'date-fns';

const ResourceView: React.FC = () => {
  const { developers, projects, allocations } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'bandwidth' | 'availability'>('bandwidth');

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
    let filtered = developersWithAllocations.filter(dev => {
      const matchesSearch = dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dev.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSkill = !skillFilter || dev.skills.some(skill => 
        skill.toLowerCase().includes(skillFilter.toLowerCase())
      );
      return matchesSearch && matchesSkill;
    });

    // Sort based on selected criteria
    filtered.sort((a, b) => {
      if (sortBy === 'bandwidth') {
        if (b.currentBandwidth !== a.currentBandwidth) {
          return b.currentBandwidth - a.currentBandwidth;
        }
      } else if (sortBy === 'availability') {
        const aAvail = a.currentBandwidth < 100 ? 0 : (a.nextAvailableDate?.getTime() || Infinity);
        const bAvail = b.currentBandwidth < 100 ? 0 : (b.nextAvailableDate?.getTime() || Infinity);
        if (aAvail !== bAvail) return aAvail - bAvail;
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [developersWithAllocations, searchTerm, skillFilter, sortBy]);

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

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const today = getTodayStart();

  const stats = useMemo(() => {
    const available = filteredDevelopers.filter(d => d.currentBandwidth < 100).length;
    const fullCapacity = filteredDevelopers.filter(d => d.currentBandwidth === 100).length;
    const overallocated = filteredDevelopers.filter(d => d.currentBandwidth > 100).length;
    return { available, fullCapacity, overallocated, total: filteredDevelopers.length };
  }, [filteredDevelopers]);

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-600">Total Resources</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-3">
          <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          <div className="text-xs text-gray-600">Available</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-3">
          <div className="text-2xl font-bold text-yellow-600">{stats.fullCapacity}</div>
          <div className="text-xs text-gray-600">Full Capacity</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-3">
          <div className="text-2xl font-bold text-red-600">{stats.overallocated}</div>
          <div className="text-xs text-gray-600">Overallocated</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Skills</option>
            {allSkills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="bandwidth">Sort by Bandwidth</option>
            <option value="availability">Sort by Availability</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Compact Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-10"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Developer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Skills</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Allocation</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden sm:table-cell">Availability</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Active Projects</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDevelopers.map(developer => {
                const isExpanded = expandedRows.has(developer.id);
                const activeAllocations = developer.allocations.filter(alloc => 
                  isAfter(alloc.endDate, today) && isBefore(alloc.startDate, today)
                );
                const upcomingAllocations = developer.allocations.filter(alloc => 
                  isAfter(alloc.startDate, today)
                );
                
                return (
                  <React.Fragment key={developer.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(developer.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-medium">
                              {developer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">{developer.name}</div>
                            <div className="text-xs text-gray-500 truncate">{developer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {developer.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {developer.skills.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{developer.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getBandwidthColor(developer.currentBandwidth)}`}>
                            {developer.currentBandwidth}%
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {developer.currentBandwidth < 100 ? (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Now ({100 - developer.currentBandwidth}%)
                          </div>
                        ) : developer.nextAvailableDate ? (
                          <div className="text-xs text-gray-600">
                            {formatDate(developer.nextAvailableDate)}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {activeAllocations.length} active
                          {upcomingAllocations.length > 0 && (
                            <span className="text-gray-500"> / {upcomingAllocations.length} upcoming</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="space-y-3">
                            {/* Full Skills List */}
                            <div>
                              <div className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                All Skills
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {developer.skills.map(skill => (
                                  <span key={skill} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {/* Allocations */}
                            {(activeAllocations.length > 0 || upcomingAllocations.length > 0) && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Assignments
                                </div>
                                <div className="space-y-1.5">
                                  {[...activeAllocations, ...upcomingAllocations]
                                    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                                    .map(allocation => {
                                      const isActive = isBefore(allocation.startDate, today);
                                      return (
                                        <div key={allocation.id} className="flex items-center justify-between bg-white rounded p-2 text-xs">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                              isActive ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                              {isActive ? 'Active' : 'Upcoming'}
                                            </span>
                                            <span className="font-medium text-gray-900 truncate">{allocation.project.name}</span>
                                            <span className="text-gray-500 flex-shrink-0">
                                              {formatDate(allocation.startDate)} → {formatDate(allocation.endDate)}
                                            </span>
                                          </div>
                                          <div className="text-primary-600 font-semibold ml-2">
                                            {allocation.bandwidth}%
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                            
                            {developer.allocations.length === 0 && (
                              <div className="text-xs text-gray-500 italic text-center py-2">
                                No active or upcoming assignments
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredDevelopers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-500 text-sm">No developers found</div>
            {(searchTerm || skillFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSkillFilter('');
                }}
                className="mt-2 text-primary-600 text-sm hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceView;

