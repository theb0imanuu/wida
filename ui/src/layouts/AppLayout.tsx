import React, { useState } from 'react';
import { LayoutDashboard, ListTree, List, Server, Clock, AlertTriangle, Settings, Search, Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isLeader = true }) => {
  const [darkTheme, setDarkTheme] = useState(false);
  
  const tabs = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Queues', icon: <ListTree size={20} /> },
    { name: 'Jobs', icon: <List size={20} /> },
    { name: 'Workers', icon: <Server size={20} /> },
    { name: 'Scheduler', icon: <Clock size={20} /> },
    { name: 'DLQ', icon: <AlertTriangle size={20} /> },
  ];

  return (
    <div className={`flex h-screen overflow-hidden ${darkTheme ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`w-64 flex flex-col border-r z-20 transition-colors ${darkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className={`flex items-center justify-center h-16 border-b ${darkTheme ? 'border-gray-700 bg-brand-900/20' : 'border-gray-200 bg-brand-50'}`}>
          <span className={`text-2xl font-bold tracking-tight ${darkTheme ? 'text-brand-400' : 'text-brand-600'}`}>Wida</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-3">
            {tabs.map((tab) => (
              <li key={tab.name}>
                <button
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab.name
                      ? darkTheme ? 'text-white bg-brand-600' : 'text-white bg-brand-600 shadow-md'
                      : darkTheme ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className={`mr-3 ${activeTab === tab.name ? 'text-white' : ''}`}>{tab.icon}</span>
                  {tab.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className={`p-4 border-t ${darkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
          <button className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg ${darkTheme ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Settings size={20} className="mr-3" /> Settings
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <header className={`flex items-center justify-between h-16 px-8 border-b z-10 sticky top-0 backdrop-blur-md ${darkTheme ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
          <div className="flex items-center space-x-4 flex-1">
            <h1 className="text-xl font-semibold tracking-tight w-48">{activeTab}</h1>
            <div className={`relative flex-1 max-w-md hidden md:block`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`} />
              <input 
                type="text" 
                placeholder="Search jobs by ID, queue, or status..." 
                className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 border ${darkTheme ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <span className={`relative inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              isLeader 
                ? darkTheme ? 'bg-green-900/30 text-green-400 border-green-800/50' : 'bg-green-50 text-green-700 border-green-200' 
                : darkTheme ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              {isLeader && (
                <span className="flex h-2 w-2 mr-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
              Leader: {isLeader ? 'Active' : 'Standby'}
            </span>

            <button onClick={() => setDarkTheme(!darkTheme)} className={`p-2 rounded-full transition-colors ${darkTheme ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              {darkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="flex items-center gap-2 cursor-pointer">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${darkTheme ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'}`}>
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className={`flex-1 overflow-y-auto p-8 relative ${darkTheme ? 'text-gray-200' : 'text-gray-800'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
