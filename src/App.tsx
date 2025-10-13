import React, { useState } from 'react';
import { DataProvider, useData } from './contexts/DataContext';
import ResourceView from './components/ResourceView';
import ProjectView from './components/ProjectView';
import AvailabilityFinder from './components/AvailabilityFinder';
import ManageData from './components/ManageData';
import TimelineView from './components/TimelineViewEnhanced';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import { Users, Briefcase, Search, Settings, Menu, Calendar } from 'lucide-react';

type ViewType = 'resources' | 'projects' | 'timeline' | 'availability' | 'manage';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('timeline');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loading, error, refreshData } = useData();

  const navigationItems = [
    { id: 'resources' as ViewType, label: 'Resource View', icon: Users },
    { id: 'projects' as ViewType, label: 'Project View', icon: Briefcase },
    { id: 'timeline' as ViewType, label: 'Timeline View', icon: Calendar },
    { id: 'availability' as ViewType, label: 'Find Resources', icon: Search },
    { id: 'manage' as ViewType, label: 'Manage Data', icon: Settings },
  ];

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
                  <p className="text-sm text-gray-600">Plan, track, and optimize your team</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Navigation */}
          <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block mb-6`}>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              {navigationItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setCurrentView(id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentView === id
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main>
            {currentView === 'resources' && <ResourceView />}
            {currentView === 'projects' && <ProjectView />}
            {currentView === 'timeline' && <TimelineView />}
            {currentView === 'availability' && <AvailabilityFinder />}
            {currentView === 'manage' && <ManageData />}
          </main>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-600">
              Resource Management Tool - Track allocations, plan projects, and optimize team resources
            </p>
          </div>
        </footer>
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

