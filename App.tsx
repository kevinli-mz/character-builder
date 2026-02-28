import React, { useState, useEffect, useCallback } from 'react';
import { AppData, View, Preset } from './types';
import { getStoredData, saveStoredData } from './services/storage';
import { Configurator } from './components/Configurator';
import { AdminDashboard } from './components/AdminDashboard';
import { UserProfile } from './components/UserProfile';
import { Auth } from './components/Auth';
import { useAuth } from './contexts/AuthContext';
import { DATA_LOAD_TIMEOUT_MS, AUTH_LOADING_TIMEOUT_MS } from './constants/appConfig';
import { GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>(View.CONFIGURATOR);
  const [data, setData] = useState<AppData>({ categories: [], assets: [] });
  const [loading, setLoading] = useState(true);

  // Load data on mount - only reload when user actually changes (not on every auth state change)
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadData = async () => {
      // 设置超时，防止无限加载
      timeoutId = setTimeout(async () => {
        if (mounted && loading) {
          console.warn('数据加载超时，使用默认数据');
          try {
            const { getStoredDataSync } = await import('./services/storage');
            if (mounted) {
              setData(getStoredDataSync());
              setLoading(false);
            }
          } catch (error) {
            console.error('超时后加载默认数据失败:', error);
            if (mounted) {
              setData({ categories: [], assets: [] });
              setLoading(false);
            }
          }
        }
      }, DATA_LOAD_TIMEOUT_MS);

      try {
        const stored = await getStoredData();
        if (mounted) {
          setData(stored);
          setLoading(false);
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        // 使用同步版本作为后备
        try {
          const { getStoredDataSync } = await import('./services/storage');
          if (mounted) {
            setData(getStoredDataSync());
            setLoading(false);
            clearTimeout(timeoutId);
          }
        } catch (fallbackError) {
          console.error('后备加载也失败:', fallbackError);
          if (mounted) {
            // 使用空数据，至少让应用可以运行
            setData({ categories: [], assets: [] });
            setLoading(false);
            clearTimeout(timeoutId);
          }
        }
      }
    };
    
    if (!authLoading) {
      loadData();
    } else {
      const authTimeout = setTimeout(() => {
        if (mounted && authLoading) {
          console.warn('认证加载超时，继续加载数据');
          loadData();
        }
      }, AUTH_LOADING_TIMEOUT_MS);
      
      return () => {
        clearTimeout(authTimeout);
        clearTimeout(timeoutId);
        mounted = false;
      };
    }
    
    // Check hash for routing
    const checkHash = () => {
        if (window.location.hash === '#admin') {
            setView(View.ADMIN);
        } else if (window.location.hash === '#profile') {
            setView(View.USER_PROFILE);
        } else {
            setView(View.CONFIGURATOR);
        }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    
    return () => {
      window.removeEventListener('hashchange', checkHash);
      clearTimeout(timeoutId);
      mounted = false;
    };
  }, [authLoading, user?.id]);

  const handleUpdateData = useCallback(async (newData: AppData) => {
    setData(newData);
    try {
      await saveStoredData(newData);
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }, []);

  const goAdmin = useCallback(() => { window.location.hash = 'admin'; }, []);
  const goProfile = useCallback(() => { window.location.hash = 'profile'; }, []);
  const goConfigurator = useCallback(() => { window.location.hash = ''; }, []);

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#fdfbf7] text-stone-400">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-400 rounded-2xl mb-4 rotate-3 animate-pulse">
            <GraduationCap className="w-8 h-8 text-white" />
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
      return (
        <div className="h-screen flex items-center justify-center bg-[#fdfbf7]">
          <div className="text-center">
            <p className="text-stone-600 mb-4">您没有管理员权限</p>
            <button onClick={goConfigurator} className="text-emerald-600 hover:underline">
              返回配置器
            </button>
          </div>
        </div>
      );
    }
    return <AdminDashboard data={data} onUpdate={handleUpdateData} onLogout={() => {}} />;
  }

  if (view === View.USER_PROFILE) {
    return (
      <UserProfile
        onClose={goConfigurator}
        onLoadPreset={(preset: Preset) => {
          goConfigurator();
          sessionStorage.removeItem('configuratorState');
          sessionStorage.setItem('loadPreset', JSON.stringify(preset));
        }}
      />
    );
  }

  return (
    <Configurator
      data={data}
      onAdminClick={isAdmin ? goAdmin : undefined}
      onProfileClick={goProfile}
    />
  );
};

export default App;
