import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Team } from '../types';
import { X, Plus, UserPlus, Users, Settings, Trash2 } from 'lucide-react';

// Add API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

const TeamManagement: React.FC = () => {
  const { token } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [joinTeamId, setJoinTeamId] = useState('');

  // Fetch user's teams
  const fetchTeams = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/teams`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      const data = await response.json();
      setTeams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch team members
  const fetchTeamMembers = async (teamId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await response.json();
      setTeamMembers(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Create new team
  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newTeamName.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create team');
      }

      const data = await response.json();
      setTeams([data, ...teams]);
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Join team
  const joinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !joinTeamId.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/teams/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: joinTeamId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join team');
      }

      const data = await response.json();
      setTeams([data, ...teams]);
      setJoinTeamId('');
      setShowJoinForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Leave team
  const leaveTeam = async (teamId: string) => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/leave`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to leave team');
      }

      setTeams(teams.filter(team => team.id !== teamId));
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setTeamMembers([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [token]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam, token]);

  if (isLoading && teams.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Team Management</h1>
        <p className="text-gray-300">Manage your teams and collaborate with your colleagues.</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
          <div className="flex items-center">
            <X className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20">
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Your Teams
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-3 py-2 text-sm bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create
                  </button>
                  <button
                    onClick={() => setShowJoinForm(true)}
                    className="px-3 py-2 text-sm bg-green-600/80 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Join
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">No teams yet. Create or join a team to get started.</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Your First Team
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedTeam?.id === team.id
                          ? 'border-blue-400 bg-blue-500/20 shadow-lg'
                          : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                      }`}
                      onClick={() => setSelectedTeam(team)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">{team.name}</h3>
                          <p className="text-sm text-gray-300 mb-2">{team.description}</p>
                          <div className="flex items-center text-xs text-gray-400">
                            <span className={`px-2 py-1 rounded-full ${
                              team.role === 'admin' 
                                ? 'bg-purple-500/20 text-purple-300' 
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {team.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                            <span className="mx-2">•</span>
                            <span>Joined {new Date(team.joinedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            leaveTeam(team.id);
                          }}
                          className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                          title="Leave team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedTeam.name}</h2>
                    <p className="text-gray-300 mt-1">{selectedTeam.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedTeam.role === 'admin' 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {selectedTeam.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-white mb-6 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Team Members ({teamMembers.length})
                </h3>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-gray-300 mt-4">Loading members...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{member.name}</p>
                            <p className="text-sm text-gray-300">{member.email}</p>
                            <div className="flex items-center mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                member.role === 'admin' 
                                  ? 'bg-purple-500/20 text-purple-300' 
                                  : 'bg-gray-500/20 text-gray-300'
                              }`}>
                                {member.role === 'admin' ? 'Admin' : 'Member'}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg mb-2">Select a team to view details</p>
              <p className="text-gray-400">Choose a team from the list to see members and manage settings.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Team
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={createTeam}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter team name"
                    required
                  />
                </div>
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter team description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setError(null);
                    }}
                    className="px-6 py-3 text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Team'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Join Team
                </h3>
                <button
                  onClick={() => {
                    setShowJoinForm(false);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={joinTeam}>
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team ID
                  </label>
                  <input
                    type="text"
                    value={joinTeamId}
                    onChange={(e) => setJoinTeamId(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter team ID"
                    required
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Ask your team admin for the team ID to join.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinForm(false);
                      setError(null);
                    }}
                    className="px-6 py-3 text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-green-600/80 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Joining...
                      </>
                    ) : (
                      'Join Team'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
