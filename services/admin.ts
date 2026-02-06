import { supabase } from './supabase';
import { ADMIN_CACHE_DURATION_MS, ADMIN_CHECK_TIMEOUT_MS } from '../constants/appConfig';

// 缓存管理员状态，避免频繁查询；isAdmin() 与 getUserAdminStatus() 共用
let adminStatusCache: { userId: string | null; isAdmin: boolean; timestamp: number } = {
  userId: null,
  isAdmin: false,
  timestamp: 0
};

// 检查当前用户是否是管理员（带缓存）
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      adminStatusCache = { userId: null, isAdmin: false, timestamp: 0 };
      return false;
    }

    const now = Date.now();
    if (
      adminStatusCache.userId === user.id &&
      now - adminStatusCache.timestamp < ADMIN_CACHE_DURATION_MS
    ) {
      return adminStatusCache.isAdmin;
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Admin check timeout')), ADMIN_CHECK_TIMEOUT_MS);
    });

    const queryPromise = supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    const isAdminResult = !error && data && (data as { is_admin: boolean }).is_admin === true;
    
    // 更新缓存
    adminStatusCache = {
      userId: user.id,
      isAdmin: isAdminResult,
      timestamp: now
    };

    return isAdminResult;
  } catch (error) {
    console.error('检查管理员状态错误:', error);
    // 如果查询失败，返回缓存的值（如果有）
    if (adminStatusCache.userId) {
      return adminStatusCache.isAdmin;
    }
    return false;
  }
}

// 清除管理员状态缓存（当用户状态改变时调用）
export function clearAdminCache() {
  adminStatusCache = { userId: null, isAdmin: false, timestamp: 0 };
}

// 获取用户的管理员状态；若为当前会话用户则写入共享缓存，供 isAdmin() 使用
export async function getUserAdminStatus(userId: string): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), ADMIN_CHECK_TIMEOUT_MS);
    });

    const queryPromise = supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
    const isAdminResult = !error && data && (data as any).is_admin === true;

    // 若为当前会话用户，更新共享缓存，减少后续 isAdmin() 的 DB 调用
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === userId) {
      adminStatusCache = {
        userId,
        isAdmin: isAdminResult,
        timestamp: Date.now()
      };
    }

    return isAdminResult;
  } catch (error) {
    console.error('获取管理员状态错误:', error);
    return false;
  }
}

// 获取所有用户（仅管理员可用）
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, email, display_name, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Array<{ user_id: string; email: string; display_name: string | null; is_admin: boolean; created_at: string }>;
  } catch (error) {
    console.error('获取用户列表错误:', error);
    throw error;
  }
}

// 更新用户的管理员状态（仅管理员可用）
export async function updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
  try {
    // Use raw SQL or bypass type checking
    const { error } = await (supabase
      .from('user_profiles')
      .update({ is_admin: isAdmin } as never)
      .eq('user_id', userId) as any);

    if (error) throw error;
  } catch (error) {
    console.error('更新管理员状态错误:', error);
    throw error;
  }
}

