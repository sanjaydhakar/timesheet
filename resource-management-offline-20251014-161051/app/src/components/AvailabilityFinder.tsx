import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { findAvailableDevelopers } from '../utils/calculations';
import { formatDate } from '../utils/dateUtils';
import { Search, User, Calendar, Award, TrendingUp } from 'lucide-react';

const AvailabilityFinder: React.FC = () => {
  const { developers, allocations, projects } = useData();
  const [requiredBandwidth, setRequiredBandwidth] = useState<50 | 100>(50);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    developers.forEach(dev => dev.skills.forEach(skill => skills.add(skill)));
    projects.forEach(proj => proj.requiredSkills.forEach(skill => skills.add(skill)));
    return Array.from(skills).sort();
  }, [developers, projects]);

  const availableDevelopers = useMemo(() => {
    if (!showResults) return [];
    return findAvailableDevelopers(developers, allocations, requiredBandwidth, selectedSkills);
  }, [developers, allocations, requiredBandwidth, selectedSkills, showResults]);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const getSkillMatchColor = (match: number) => {
    if (match >= 80) return 'text-green-600 bg-green-50';
    if (match >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-6 h-6 text-primary-600" />
          Find Available Developers
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Required Bandwidth
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="requiredBandwidth"
                  value="50"
                  checked={requiredBandwidth === 50}
                  onChange={() => setRequiredBandwidth(50)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">50% (Half-time)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="requiredBandwidth"
                  value="100"
                  checked={requiredBandwidth === 100}
                  onChange={() => setRequiredBandwidth(100)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">100% (Full-time)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Skills (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {allSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedSkills.includes(skill)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowResults(true)}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Search Available Developers
          </button>
        </div>
      </div>

      {showResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Developers ({availableDevelopers.length} found)
          </h3>

          {availableDevelopers.length === 0 ? (
            <p className="text-gray-500 italic">
              No developers found matching the criteria. Try adjusting your requirements.
            </p>
          ) : (
            <div className="space-y-4">
              {availableDevelopers.map(({ developer, availableBandwidth, availableFrom, skillMatch }) => (
                <div key={developer.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{developer.name}</h4>
                        <p className="text-sm text-gray-600">{developer.email}</p>
                      </div>
                    </div>
                    {selectedSkills.length > 0 && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillMatchColor(skillMatch)}`}>
                        {Math.round(skillMatch)}% Skill Match
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500">Available Bandwidth</div>
                        <div className="font-semibold text-primary-600">{availableBandwidth}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500">Available From</div>
                        <div className="font-semibold text-gray-900">{formatDate(availableFrom)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500">Total Skills</div>
                        <div className="font-semibold text-gray-900">{developer.skills.length}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Skills:</div>
                    <div className="flex flex-wrap gap-1">
                      {developer.skills.map(skill => {
                        const isMatching = selectedSkills.some(s => 
                          skill.toLowerCase().includes(s.toLowerCase()) ||
                          s.toLowerCase().includes(skill.toLowerCase())
                        );
                        return (
                          <span
                            key={skill}
                            className={`px-2 py-0.5 rounded text-xs ${
                              isMatching
                                ? 'bg-green-100 text-green-700 font-medium'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailabilityFinder;

