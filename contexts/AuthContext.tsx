import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { getUserAdminStatus, clearAdminCache } from '../services/admin';
import { AUTH_LOADING_TIMEOUT_MS } from '../constants/appConfig';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithWechat: () => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    try {
      const adminStatus = await getUserAdminStatus(userId);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('检查管理员状态错误:', error);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // 设置超时，防止无限加载
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth loading timeout, proceeding anyway');
        setLoading(false);
      }
    }, AUTH_LOADING_TIMEOUT_MS);

    // 获取初始会话
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('获取会话错误:', error);
        setLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          await checkAdminStatus(session.user.id);
        } catch (error) {
          console.error('检查管理员状态错误:', error);
          // 即使检查失败也继续
        }
      }
      
      if (mounted) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }).catch((error) => {
      console.error('获取会话异常:', error);
      if (mounted) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          await checkAdminStatus(session.user.id);
        } catch (error) {
          console.error('检查管理员状态错误:', error);
          // 即使检查失败也继续
        }
      } else {
        setIsAdmin(false);
      }
      
      if (mounted) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    if (error) return { error };
    if (data.user) {
      setUser(data.user);
      setSession(data.session);
      await checkAdminStatus(data.user.id);
    }
    return { error: null };
  }, [checkAdminStatus]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    if (data.user && data.session) {
      setUser(data.user);
      setSession(data.session);
      await checkAdminStatus(data.user.id);
    }
    return { error: null };
  }, [checkAdminStatus]);

  const signInWithWechat = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'wechat' as any,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('微信登录失败') };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearAdminCache();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isAdmin,
      loading,
      signUp,
      signIn,
      signInWithWechat,
      signOut,
      resetPassword,
    }),
    [user, session, isAdmin, loading, signUp, signIn, signInWithWechat, signOut, resetPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

