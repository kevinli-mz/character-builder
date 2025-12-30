import { AppData, Asset, Category } from '../types';

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
    { id: 'hand', name: 'Hand', zIndex: 55 }, // New Layer
    { id: 'glasses', name: 'Glasses', zIndex: 60 },
    { id: 'accessories', name: 'Accessories', zIndex: 70 }, // New Layer
  ],
  assets: [
    // Default Placeholders
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
    // Simple placeholder for hand
    {
      id: 'hand-1',
      name: 'Waving',
      categoryId: 'hand',
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI2MDAiIGN5PSI0NTAiIHI9IjQwIiBmaWxsPSIjZmZkMGMxIi8+PC9zdmc+'
    },
    // Simple placeholder for accessories
    {
      id: 'acc-1',
      name: 'Star Pin',
      categoryId: 'accessories',
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cG9seWdvbiBwb2ludHM9IjMwMCwzNTAgMzEwLDM4MCAzNDAsMzgwIDMxNSw0MDAgMzI1LDQzMCAzMDAsNDEwIDI3NSw0MzAgMjg1LDQwMCAyNjAsMzgwIDI5MCwzODAiIGZpbGw9IiNmZmQ3MDAiIHN0cm9rZT0iI2RhYTUyMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+'
    }
  ]
};

export const getStoredData = (): AppData => {
  // 1. Try to get current version data
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Basic validation
      if (parsed.categories && parsed.assets) return parsed;
    } catch (e) {
      console.error("Failed to parse stored data", e);
    }
  }

  // 2. Migration: Check for previous version data
  const prevStored = localStorage.getItem(PREVIOUS_STORAGE_KEY);
  if (prevStored) {
    try {
      const parsedPrev = JSON.parse(prevStored) as AppData;
      
      // We found old data! Let's migrate it by adding the new layers if they don't exist.
      // We do not overwrite assets, we just ensure new categories are available.
      
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
        // We can optionally add default assets for new layers here if we wanted, 
        // but typically migration just preserves structure. 
        // We'll append the default assets for the new layers so the user has something to start with.
        assets: [
            ...parsedPrev.assets,
            ...DEFAULT_DATA.assets.filter(a => a.categoryId === 'hand' || a.categoryId === 'accessories')
        ]
      };

      // Save immediately to the new key so we don't have to migrate next time
      saveStoredData(migratedData);
      
      // Clean up old key (optional, but good for hygiene)
      // localStorage.removeItem(PREVIOUS_STORAGE_KEY); 

      console.log("Migrated data from v2 to v3 successfully.");
      return migratedData;

    } catch (e) {
      console.error("Failed to migrate v2 data", e);
    }
  }

  // 3. Fallback to defaults
  return DEFAULT_DATA;
};

export const saveStoredData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data (likely quota exceeded)", e);
    alert("Storage limit reached. Cannot save more assets in this demo environment.");
  }
};

export const resetToDefaults = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};