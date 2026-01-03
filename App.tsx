import React, { useState, useEffect } from 'react';
import { AppData, View } from './types';
import { getStoredData, saveStoredData } from './services/storage';
import { Configurator } from './components/Configurator';
import { AdminDashboard } from './components/AdminDashboard';
import { Auth } from './components/Auth';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>(View.CONFIGURATOR);
  const [data, setData] = useState<AppData>({ categories: [], assets: [] });
  const [loading, setLoading] = useState(true);

  // Debug: Check environment variables in production
  useEffect(() => {
    if (import.meta.env.MODE === 'production') {
      console.log('Environment check:', {
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        mode: import.meta.env.MODE
      });
    }
  }, []);

  // Load data on mount and when user changes
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await getStoredData();
        setData(stored);
      } catch (error) {
        console.error('加载数据失败:', error);
        // 使用同步版本作为后备
        const { getStoredDataSync } = await import('./services/storage');
        setData(getStoredDataSync());
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      loadData();
    }
    
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
  }, [authLoading, user]);

  const handleUpdateData = async (newData: AppData) => {
    setData(newData);
    try {
      await saveStoredData(newData);
    } catch (error) {
      console.error('保存数据失败:', error);
      // 即使保存失败，也更新本地状态
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#fdfbf7] text-stone-400">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-400 rounded-2xl mb-4 rotate-3 animate-pulse">
            <span className="text-white font-bold text-2xl">CP</span>
          </div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // Show auth if not logged in
  if (!user) {
    return <Auth />;
  }

  // Admin View (only for admins)
  if (view === View.ADMIN) {
    if (!isAdmin) {
      // Redirect non-admins back to configurator
      window.location.hash = '';
      return (
        <div className="h-screen flex items-center justify-center bg-[#fdfbf7]">
          <div className="text-center">
            <p className="text-stone-600 mb-4">您没有管理员权限</p>
            <button 
              onClick={() => window.location.hash = ''}
              className="text-emerald-600 hover:underline"
            >
              返回配置器
            </button>
          </div>
        </div>
      );
    }
    return <AdminDashboard data={data} onUpdate={handleUpdateData} onLogout={() => {}} />;
  }

  // Public View (all authenticated users can use, but only admins see admin button)
  return (
    <Configurator 
      data={data} 
      onAdminClick={isAdmin ? () => {
          window.location.hash = 'admin';
      } : undefined} 
    />
  );
};

export default App;
