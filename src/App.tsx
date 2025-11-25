import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import Login from './components/Login';
import Register from './components/Register';
import ResourceView from './components/ResourceView';
import ProjectView from './components/ProjectView';
import AvailabilityFinder from './components/AvailabilityFinder';
import TimelineView from './components/TimelineViewEnhanced';
import TeamManagement from './components/TeamManagement';
import TeamSelector from './components/TeamSelector';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import { Users, Briefcase, Search, Menu, Calendar, X, BarChart3, LogOut, Users2 } from 'lucide-react';

type ViewType = 'resources' | 'projects' | 'timeline' | 'availability' | 'teams';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('timeline');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, switchTeam } = useAuth();
  const { loading, error, refreshSelective } = useData();

  // Refresh only needed data when tab changes
  useEffect(() => {
    // Skip if user is not loaded yet
    if (!user?.id) return;

    console.log('🔄 Fetching data for view:', currentView, 'user:', user?.id);

    const dataNeededByView: Record<ViewType, ('developers' | 'projects' | 'allocations')[]> = {
      timeline: ['developers', 'projects', 'allocations'], // Timeline needs all data
      resources: ['developers', 'allocations'], // Resources view needs developers and their allocations
      projects: ['projects', 'allocations'], // Projects view needs projects and their allocations
      availability: ['developers', 'allocations'], // Availability finder needs developers and allocations
      teams: [], // Teams view doesn't need resource data
    };

    const dataToFetch = dataNeededByView[currentView];
    if (dataToFetch.length > 0) {
      refreshSelective(dataToFetch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, user?.id]); // Only depend on user.id, not the entire user object

  const navigationItems = [
    { id: 'timeline' as ViewType, label: 'Timeline', icon: Calendar, description: 'Visual planning' },
    { id: 'resources' as ViewType, label: 'Resources', icon: Users, description: 'Team overview' },
    { id: 'projects' as ViewType, label: 'Projects', icon: Briefcase, description: 'Project status' },
    { id: 'availability' as ViewType, label: 'Find Resources', icon: Search, description: 'Smart search' },
    { id: 'teams' as ViewType, label: 'Teams', icon: Users2, description: 'Team management' },
  ];

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-72 glass-dark border-r border-white/10 backdrop-blur-xl">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo */}
          <div className="flex items-center gap-3 h-20 px-6 border-b border-white/10">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Resource Hub</h1>
              <p className="text-xs text-gray-400">Team Planning Tool</p>
            </div>
          </div>

          {/* Desktop Team Selector */}
          {user?.teams && user.teams.length > 1 && (
            <div className="px-4 py-4 border-b border-white/10">
              <TeamSelector
                selectedTeamId={user.currentTeamId}
                onTeamChange={switchTeam}
                className="w-full"
              />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ${
                  currentView === id
                    ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/30 scale-[1.02]'
                    : 'text-gray-300 hover:bg-white/10 hover:shadow-md'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  currentView === id ? 'text-white' : 'text-primary-400'
                }`} />
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold">{label}</div>
                  <div className={`text-xs ${currentView === id ? 'text-white/80' : 'text-gray-400'}`}>
                    {description}
                  </div>
                </div>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="bg-gradient-to-r from-primary-900/30 to-purple-900/30 rounded-xl p-4 border border-primary-500/20">
              <p className="text-xs text-primary-300 font-medium mb-1">💡 Pro Tip</p>
              <p className="text-xs text-gray-400">Drag on timeline to quickly add allocations</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 glass-dark backdrop-blur-xl animate-slide-in">
            <div className="flex-1 flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Resource Hub</h1>
                    <p className="text-xs text-gray-300">Planning Tool</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Team Selector */}
              {user?.teams && user.teams.length > 1 && (
                <div className="px-4 py-4 border-b border-white/10">
                  <TeamSelector
                    selectedTeamId={user.currentTeamId}
                    onTeamChange={switchTeam}
                    className="w-full"
                  />
                </div>
              )}

              {/* Mobile Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigationItems.map(({ id, label, icon: Icon, description }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setCurrentView(id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all ${
                      currentView === id
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs opacity-70">{description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="glass-dark border-b border-white/10 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center justify-between h-20 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {navigationItems.find(item => item.id === currentView)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {navigationItems.find(item => item.id === currentView)?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg border border-white/10">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold text-white">{user?.name}</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="animate-slide-in">
            {currentView === 'resources' && <ResourceView />}
            {currentView === 'projects' && <ProjectView />}
            {currentView === 'timeline' && <TimelineView />}
            {currentView === 'availability' && <AvailabilityFinder />}
            {currentView === 'teams' && <TeamManagement />}
          </div>
        </div>
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

function App() {
  const [showRegister, setShowRegister] = useState(false);
  
  return (
    <AuthProvider>
      <AuthContent showRegister={showRegister} setShowRegister={setShowRegister} />
    </AuthProvider>
  );
}

function AuthContent({ showRegister, setShowRegister }: { showRegister: boolean; setShowRegister: (value: boolean) => void }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return showRegister ? (
      <Register onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return <AuthenticatedApp />;
}

export default App;

