import React, { useState } from 'react';
import { DataProvider, useData } from './contexts/DataContext';
import ResourceView from './components/ResourceView';
import ProjectView from './components/ProjectView';
import AvailabilityFinder from './components/AvailabilityFinder';
import ManageData from './components/ManageData';
import TimelineView from './components/TimelineViewEnhanced';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import { Users, Briefcase, Search, Settings, Menu, Calendar, X, BarChart3 } from 'lucide-react';

type ViewType = 'resources' | 'projects' | 'timeline' | 'availability' | 'manage';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('timeline');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [manageContext, setManageContext] = useState<{ type?: 'developer' | 'project' | 'allocation', id?: string } | null>(null);
  const { loading, error, refreshData } = useData();

  const navigationItems = [
    { id: 'timeline' as ViewType, label: 'Timeline', icon: Calendar, description: 'Visual planning' },
    { id: 'resources' as ViewType, label: 'Resources', icon: Users, description: 'Team overview' },
    { id: 'projects' as ViewType, label: 'Projects', icon: Briefcase, description: 'Project status' },
    { id: 'availability' as ViewType, label: 'Find Resources', icon: Search, description: 'Smart search' },
    { id: 'manage' as ViewType, label: 'Manage', icon: Settings, description: 'Data management' },
  ];

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-72 glass border-r border-gray-200/50 backdrop-blur-xl">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo */}
          <div className="flex items-center gap-3 h-20 px-6 border-b border-gray-200/50">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Resource Hub</h1>
              <p className="text-xs text-gray-600">Team Planning Tool</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ${
                  currentView === id
                    ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/30 scale-[1.02]'
                    : 'text-gray-700 hover:bg-white/70 hover:shadow-md'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  currentView === id ? 'text-white' : 'text-primary-600'
                }`} />
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold">{label}</div>
                  <div className={`text-xs ${currentView === id ? 'text-white/80' : 'text-gray-500'}`}>
                    {description}
                  </div>
                </div>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200/50">
            <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4">
              <p className="text-xs text-gray-700 font-medium mb-1">💡 Pro Tip</p>
              <p className="text-xs text-gray-600">Drag on timeline to quickly add allocations</p>
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
        <header className="glass border-b border-gray-200/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center justify-between h-20 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:bg-white/70 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {navigationItems.find(item => item.id === currentView)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {navigationItems.find(item => item.id === currentView)?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/70 rounded-lg border border-gray-200/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700 font-medium">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="animate-slide-in">
            {currentView === 'resources' && (
              <ResourceView 
                onEdit={(developerId) => {
                  setManageContext({ type: 'developer', id: developerId });
                  setCurrentView('manage');
                }}
                onAddAllocation={(developerId) => {
                  setManageContext({ type: 'allocation', id: developerId });
                  setCurrentView('manage');
                }}
              />
            )}
            {currentView === 'projects' && (
              <ProjectView 
                onEdit={(projectId) => {
                  setManageContext({ type: 'project', id: projectId });
                  setCurrentView('manage');
                }}
                onAddAllocation={(projectId) => {
                  setManageContext({ type: 'allocation', id: projectId });
                  setCurrentView('manage');
                }}
              />
            )}
            {currentView === 'timeline' && <TimelineView />}
            {currentView === 'availability' && <AvailabilityFinder />}
            {currentView === 'manage' && (
              <ManageData 
                initialContext={manageContext}
                onContextCleared={() => setManageContext(null)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;

