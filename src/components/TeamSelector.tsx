import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Team } from '../types';
import { ChevronDown, Users } from 'lucide-react';

interface TeamSelectorProps {
  selectedTeamId?: string;
  onTeamChange: (teamId: string) => void;
  className?: string;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ 
  selectedTeamId, 
  onTeamChange, 
  className = '' 
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user || !user.teams || user.teams.length === 0) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 ${className}`}>
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">No teams available</span>
      </div>
    );
  }

  if (user.teams.length === 1) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 ${className}`}>
        <Users className="w-4 h-4 text-primary-400" />
        <div>
          <div className="text-sm font-medium text-white">{user.teams[0].name}</div>
          <div className="text-xs text-gray-400 capitalize">{user.teams[0].role}</div>
        </div>
      </div>
    );
  }

  const currentTeam = user.teams.find(team => team.id === (selectedTeamId || user.currentTeamId)) || user.teams[0];

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left"
      >
        <Users className="w-4 h-4 text-primary-400" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{currentTeam.name}</div>
          <div className="text-xs text-gray-400 capitalize">{currentTeam.role}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-lg z-50">
          {user.teams.map((team: Team) => (
            <button
              key={team.id}
              onClick={() => {
                onTeamChange(team.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/10 transition-colors ${
                team.id === currentTeam.id ? 'bg-primary-500/20 text-primary-300' : 'text-white'
              }`}
            >
              <Users className="w-4 h-4 text-primary-400" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{team.name}</div>
                <div className="text-xs text-gray-400 capitalize">{team.role}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamSelector;
