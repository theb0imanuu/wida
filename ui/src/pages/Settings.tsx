import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Settings: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('wida-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('wida-theme', newTheme);
    // Add/remove light-theme class to root element
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-1">Settings</h2>
        <p className="text-sm text-secondary">Manage your application preferences and UI settings.</p>
      </div>

      <Card className="flex flex-col space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">Appearance</h3>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-sm font-medium text-primary">Theme Preference</p>
              <p className="text-xs text-secondary mt-1">Choose between light and dark mode for the dashboard.</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant={theme === 'light' ? 'primary' : 'secondary'} 
                onClick={() => handleThemeChange('light')}
                className="w-24"
              >
                Light
              </Button>
              <Button 
                variant={theme === 'dark' ? 'primary' : 'secondary'} 
                onClick={() => handleThemeChange('dark')}
                className="w-24"
              >
                Dark
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4 mt-2">Data Management</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Clear Local Cache</p>
              <p className="text-xs text-secondary mt-1">Removes saved preferences and search history from this browser.</p>
            </div>
            <Button 
              variant="danger" 
              onClick={() => {
                localStorage.removeItem('wida-theme');
                alert('Local cache cleared.');
                window.location.reload();
              }}
            >
              Clear Cache
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="text-center text-xs text-secondary mt-8 space-y-1">
        <p>Wida Dashboard UI Configuration</p>
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};
