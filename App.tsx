import React, { useState, useEffect } from 'react';
import { AppData, View } from './types';
import { getStoredData, saveStoredData } from './services/storage';
import { Configurator } from './components/Configurator';
import { AdminDashboard } from './components/AdminDashboard';
import { Button } from './components/ui/Button';

// Mock password for demo
const ADMIN_PASSWORD = "admin";

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.CONFIGURATOR);
  const [data, setData] = useState<AppData>({ categories: [], assets: [] });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const stored = getStoredData();
    setData(stored);
    setLoading(false);
    
    // Check hash for routing
    const checkHash = () => {
        if (window.location.hash === '#admin') {
            setView(View.ADMIN);
        } else {
            setView(View.CONFIGURATOR);
        }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleUpdateData = (newData: AppData) => {
    setData(newData);
    saveStoredData(newData);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (document.getElementById('password') as HTMLInputElement).value;
    if (input === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Invalid password. Try 'admin'");
    }
  };

  if (loading) {
      return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading...</div>;
  }

  // Admin View
  if (view === View.ADMIN) {
    if (!isAuthenticated) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Access</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input 
                  id="password" 
                  type="password" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" 
                  placeholder="Enter 'admin'"
                />
              </div>
              <Button type="submit" className="w-full">Login</Button>
            </form>
            <div className="mt-4 text-center">
                <a href="#" className="text-sm text-indigo-600 hover:underline">Back to Configurator</a>
            </div>
          </div>
        </div>
      );
    }
    return <AdminDashboard data={data} onUpdate={handleUpdateData} onLogout={() => setIsAuthenticated(false)} />;
  }

  // Public View
  return (
    <Configurator 
      data={data} 
      onAdminClick={() => {
          window.location.hash = 'admin';
      }} 
    />
  );
};

export default App;
