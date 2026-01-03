import { AppData, Asset, Category } from '../types';
import { fetchData, saveData } from './api';
import { supabase } from './supabase';

const STORAGE_KEY = 'peeps_builder_data_v3';
const PREVIOUS_STORAGE_KEY = 'peeps_builder_data_v2';

// Default initial data including the new layers
const DEFAULT_DATA: AppData = {
  categories: [
    { id: 'background', name: 'Background', zIndex: 0, defaultAssetId: 'bg-1' },
    { id: 'body', name: 'Body', zIndex: 10, defaultAssetId: 'body-1' },
    { id: 'skin', name: 'Skin', zIndex: 20, defaultAssetId: 'skin-1' },
    { id: 'clothing', name: 'Clothing', zIndex: 30 },
    { id: 'face', name: 'Face', zIndex: 40, defaultAssetId: 'face-1' },
    { id: 'hair', name: 'Hair', zIndex: 50 },
    { id: 'hand', name: 'Hand', zIndex: 55 },
    { id: 'glasses', name: 'Glasses', zIndex: 60 },
    { id: 'accessories', name: 'Accessories', zIndex: 70 },
  ],
  assets: [
    { 
      id: 'bg-1', 
      name: 'Blue Sky', 
      categoryId: 'background', 
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0iI2UzZjJmZCIvPjwvc3ZnPg==' 
    },
    { 
      id: 'bg-2', 
      name: 'Sunset', 
      categoryId: 'background', 
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0iI2ZmZjNlMCIvPjwvc3ZnPg==' 
    },
    { 
      id: 'body-1', 
      name: 'Standard Body', 
      categoryId: 'body', 
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI0MDAiIGN5PSI1MDAiIHI9IjIwMCIgZmlsbD0iI2UyZThlOCIvPjwvc3ZnPg==' 
    },
    { 
      id: 'skin-1', 
      name: 'Light', 
      categoryId: 'skin', 
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI0MDAiIGN5PSI0MDAiIHI9IjEzMCIgZmlsbD0iI2ZmZDBjMSIvPjwvc3ZnPg==' 
    },
    { 
      id: 'skin-2', 
      name: 'Dark', 
      categoryId: 'skin', 
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI0MDAiIGN5PSI0MDAiIHI9IjEzMCIgZmlsbD0iIzhkNTUyNCIvPjwvc3ZnPg==' 
    },
    { 
      id: 'face-1', 
      name: 'Smile', 
      categoryId: 'face', 
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNSI+PHBhdGggZD0iTTM2MCAzOTAgcTAgMjAgMjAgMjB0MjAtMjBtNDAgMHEwIDIwIDIwIDIwdDIwLTIwIiBmaWxsPSIjMzMzIi8+PHBhdGggZD0iTTM1MCA0MzAgcTUwIDUwIDEwMCAwIi8+PC9nPjwvc3ZnPg==' 
    },
    { 
      id: 'hair-1', 
      name: 'Spiky', 
      categoryId: 'hair', 
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjcwIDM1MCBsMzAtNjAgbDQwIDUwIGwzMC04MCBsNDAgNzAgbDMwLTkwIGwzMCA5MCBsNTAgLTEwIGwtMjAgMTAwIFoiIGZpbGw9IiM1ZDQwMzciLz48L3N2Zz4=' 
    },
    {
      id: 'hand-1',
      name: 'Waving',
      categoryId: 'hand',
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI2MDAiIGN5PSI0NTAiIHI9IjQwIiBmaWxsPSIjZmZkMGMxIi8+PC9zdmc+'
    },
    {
      id: 'acc-1',
      name: 'Star Pin',
      categoryId: 'accessories',
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cG9seWdvbiBwb2ludHM9IjMwMCwzNTAgMzEwLDM4MCAzNDAsMzgwIDMxNSw0MDAgMzI1LDQzMCAzMDAsNDEwIDI3NSw0MzAgMjg1LDQwMCAyNjAsMzgwIDI5MCwzODAiIGZpbGw9IiNmZmQ3MDAiIHN0cm9rZT0iI2RhYTUyMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+'
    }
  ]
};

// 从 Supabase 获取数据（异步）- 现在数据是全局共享的
export const getStoredData = async (): Promise<AppData> => {
  try {
    // 检查用户是否登录
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 用户已登录，从 Supabase 获取全局共享数据
      const data = await fetchData();
      if (data.categories.length > 0 || data.assets.length > 0) {
        return data;
      }
      
      // 如果是管理员且没有数据，初始化默认数据
      const { isAdmin } = await import('./admin');
      const adminStatus = await isAdmin();
      if (adminStatus) {
        await saveData(DEFAULT_DATA);
        return DEFAULT_DATA;
      }
      
      // 普通用户返回默认数据（只读）
      return DEFAULT_DATA;
    } else {
      // 用户未登录，使用本地存储作为后备
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.categories && parsed.assets) return parsed;
        } catch (e) {
          console.error("Failed to parse stored data", e);
        }
      }
      
      // 迁移旧版本数据
      const prevStored = localStorage.getItem(PREVIOUS_STORAGE_KEY);
      if (prevStored) {
        try {
          const parsedPrev = JSON.parse(prevStored) as AppData;
          
          const newCategories = [...parsedPrev.categories];
          const existingIds = new Set(newCategories.map(c => c.id));

          if (!existingIds.has('hand')) {
            newCategories.push({ id: 'hand', name: 'Hand', zIndex: 55 });
          }
          
          if (!existingIds.has('accessories')) {
            newCategories.push({ id: 'accessories', name: 'Accessories', zIndex: 70 });
          }

          const migratedData: AppData = {
            ...parsedPrev,
            categories: newCategories,
            assets: [
                ...parsedPrev.assets,
                ...DEFAULT_DATA.assets.filter(a => a.categoryId === 'hand' || a.categoryId === 'accessories')
            ]
          };

          localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
          console.log("Migrated data from v2 to v3 successfully.");
          return migratedData;

        } catch (e) {
          console.error("Failed to migrate v2 data", e);
        }
      }
      
      return DEFAULT_DATA;
    }
  } catch (error) {
    console.warn('获取数据失败，使用本地存储:', error);
    
    // 回退到本地存储
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.categories && parsed.assets) return parsed;
      } catch (e) {
        console.error("Failed to parse stored data", e);
      }
    }
    
    return DEFAULT_DATA;
  }
};

// 同步版本（用于向后兼容）
export const getStoredDataSync = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.categories && parsed.assets) return parsed;
    } catch (e) {
      console.error("Failed to parse stored data", e);
    }
  }
  return DEFAULT_DATA;
};

// 保存数据到 Supabase（异步）
export const saveStoredData = async (data: AppData): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 用户已登录，保存到 Supabase
      await saveData(data);
    }
    
    // 同时保存到本地存储作为备份
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save data to localStorage (likely quota exceeded)", e);
    }
  } catch (error) {
    console.warn('保存到 Supabase 失败，仅保存到本地:', error);
    // 如果 Supabase 失败，至少保存到本地
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save data (likely quota exceeded)", e);
      alert("存储空间已满，无法保存更多数据。");
    }
  }
};

export const resetToDefaults = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};
