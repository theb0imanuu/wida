import React from 'react';
import { LayoutDashboard, ListTree, List, Server, Clock, AlertTriangle, Settings, Search } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isLeader = true }) => {
  const tabs = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Queues', icon: <ListTree size={18} /> },
    { name: 'Jobs', icon: <List size={18} /> },
    { name: 'Workers', icon: <Server size={18} /> },
    { name: 'Scheduler', icon: <Clock size={18} /> },
    { name: 'DLQ', icon: <AlertTriangle size={18} /> },
    { name: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-primary selection:bg-blue-500/30">
      {/* Sidebar - minimal border, no heavy shadows */}
      <div className="w-64 flex flex-col border-r border-border bg-card z-20">
        <div className="flex items-center px-6 h-16 border-b border-border">
          <span className="text-xl font-semibold tracking-tight text-primary">Wida</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-3">
            {tabs.map((tab) => (
              <li key={tab.name}>
                <button
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.name
                      ? 'bg-white/10 text-primary'
                      : 'text-secondary hover:text-primary hover:bg-white/5'
                  }`}
                >
                  <span className={`mr-3 ${activeTab === tab.name ? 'text-primary' : 'text-secondary'}`}>
                    {tab.icon}
                  </span>
                  {tab.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-background">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-8 border-b border-border z-10 sticky top-0 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-lg font-semibold tracking-tight min-w-[120px]">{activeTab}</h1>
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-9 pr-4 h-8 text-sm rounded-md bg-black/10 border border-border text-primary focus:outline-none focus:border-secondary transition-colors placeholder:text-secondary"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
              isLeader 
                ? 'bg-status-success/10 text-success border-status-success/20' 
                : 'bg-white/5 text-secondary border-border'
            }`}>
              {isLeader && (
                <span className="flex h-1.5 w-1.5 mr-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-status-success"></span>
                </span>
              )}
              {isLeader ? 'Leader Act' : 'Standby'}
            </span>

            {/* Profile Avatar Minimalist */}
            <div className="flex items-center justify-center w-7 h-7 rounded-sm bg-card border border-border text-xs font-medium cursor-pointer hover:border-blue-500 transition-colors">
              M
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
