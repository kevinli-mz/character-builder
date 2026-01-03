import React, { useState, useEffect } from 'react';
import { AppData, Asset, Category, CharacterState } from '../types';
import { Canvas } from './Canvas';
import { Button } from './ui/Button';
import { Download, Shuffle, RotateCcw, Lock } from 'lucide-react';

interface ConfiguratorProps {
  data: AppData;
  onAdminClick?: () => void;
}

export const Configurator: React.FC<ConfiguratorProps> = ({ data, onAdminClick }) => {
  const [character, setCharacter] = useState<CharacterState>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize with first category and DEFAULT assets
  useEffect(() => {
    // 1. Set active category if not set
    if (data.categories.length > 0 && !activeCategory) {
      setActiveCategory(data.categories[0].id);
    }
    
    // 2. Apply defaults if character is empty
    if (Object.keys(character).length === 0) {
        const defaults: CharacterState = {};
        data.categories.forEach(cat => {
            // Check if category has a default ID and if that asset actually exists
            if (cat.defaultAssetId && data.assets.find(a => a.id === cat.defaultAssetId)) {
                defaults[cat.id] = cat.defaultAssetId;
            }
        });
        if (Object.keys(defaults).length > 0) {
            setCharacter(defaults);
        }
    }
  }, [data.categories, data.assets]); // Dependency on assets to verify existence

  const handleAssetSelect = (catId: string, assetId: string) => {
    setCharacter(prev => ({ ...prev, [catId]: assetId }));
  };

  const handleRandomize = () => {
    const newChar: CharacterState = {};
    data.categories.forEach(cat => {
      const assets = data.assets.filter(a => a.categoryId === cat.id);
      if (assets.length > 0) {
        const randomAsset = assets[Math.floor(Math.random() * assets.length)];
        newChar[cat.id] = randomAsset.id;
      }
    });
    setCharacter(newChar);
  };

  const handleReset = () => {
    // Reset to defaults
    const defaults: CharacterState = {};
    data.categories.forEach(cat => {
        if (cat.defaultAssetId && data.assets.find(a => a.id === cat.defaultAssetId)) {
            defaults[cat.id] = cat.defaultAssetId;
        }
    });
    setCharacter(defaults);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Create a temporary canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1000; // High res
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Sort layers
      const sortedCategories = [...data.categories].sort((a, b) => a.zIndex - b.zIndex);

      // Load all images
      const imagesToDraw = sortedCategories
        .map(cat => {
            const assetId = character[cat.id];
            if(!assetId) return null;
            return data.assets.find(a => a.id === assetId);
        })
        .filter((a): a is Asset => !!a);

      // Draw sequentially
      for (const asset of imagesToDraw) {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve();
          };
          img.onerror = reject;
          img.src = asset.src;
        });
      }

      // Trigger download
      const link = document.createElement('a');
      link.download = `my-peep-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Download failed", error);
      alert("Could not generate image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const assetsForActiveCategory = data.assets.filter(a => a.categoryId === activeCategory);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#fdfbf7] overflow-hidden text-stone-700">
      
      {/* Mobile Header */}
      <div className="md:hidden p-4 bg-white/80 backdrop-blur border-b border-stone-200 flex justify-between items-center z-20 sticky top-0">
        <h1 className="font-bold text-lg text-stone-800 flex items-center gap-2">
           <span className="bg-emerald-400 text-white px-2 py-0.5 rounded-lg rotate-3 text-sm">CP</span>
           Builder
        </h1>
        {onAdminClick && (
          <Button size="sm" variant="ghost" onClick={onAdminClick}><Lock className="w-4 h-4"/></Button>
        )}
      </div>

      {/* LEFT: Controls & Assets */}
      <div className="flex-1 flex flex-col md:w-1/3 lg:w-[28rem] bg-white border-r border-stone-200 z-10 shadow-2xl md:shadow-stone-200/50 order-2 md:order-1 h-1/2 md:h-full">
        
        {/* Category Tabs */}
        <div className="flex overflow-x-auto p-4 border-b border-stone-100 gap-2 scrollbar-hide bg-white">
          {data.categories
            .sort((a,b) => a.zIndex - b.zIndex) // Display in visual order
            .map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all transform active:scale-95 ${
                activeCategory === cat.id 
                ? 'bg-emerald-400 text-white shadow-lg shadow-emerald-200' 
                : 'bg-stone-50 text-stone-500 border border-stone-100 hover:bg-stone-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Asset Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fdfbf7] custom-scrollbar">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-4">
            {/* None Option */}
            <button
               onClick={() => handleAssetSelect(activeCategory, '')}
               className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center bg-white transition-all transform hover:scale-[1.02] ${
                 !character[activeCategory] 
                 ? 'border-emerald-400 ring-4 ring-emerald-50 shadow-md' 
                 : 'border-stone-200 hover:border-emerald-200'
               }`}
            >
               <div className="w-8 h-8 rounded-full border-2 border-stone-300 mb-1"></div>
               <span className="text-xs text-stone-400 font-bold">None</span>
            </button>

            {assetsForActiveCategory.map(asset => (
              <button
                key={asset.id}
                onClick={() => handleAssetSelect(activeCategory, asset.id)}
                className={`group relative aspect-square rounded-2xl border-2 bg-white overflow-hidden transition-all transform hover:scale-[1.02] ${
                  character[activeCategory] === asset.id 
                  ? 'border-emerald-400 ring-4 ring-emerald-50 shadow-md' 
                  : 'border-stone-200 hover:border-emerald-200 hover:shadow-sm'
                }`}
              >
                <img src={asset.src} alt={asset.name} className="w-full h-full object-contain p-2" />
                <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur text-stone-600 text-[10px] font-bold py-1.5 opacity-0 group-hover:opacity-100 transition-opacity truncate text-center">
                  {asset.name}
                </div>
              </button>
            ))}
          </div>
          {assetsForActiveCategory.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-stone-400 text-sm">
               <div className="w-12 h-12 bg-stone-100 rounded-full mb-3"></div>
               No assets in this category.
             </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-6 border-t border-stone-100 bg-white flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
          <Button variant="secondary" className="flex-1 rounded-2xl" onClick={handleRandomize} title="Randomize">
            <Shuffle className="w-5 h-5 mr-2 text-emerald-500" /> Random
          </Button>
          <Button variant="ghost" className="rounded-2xl bg-stone-50" onClick={handleReset} title="Reset to Default">
            <RotateCcw className="w-5 h-5 text-stone-400" />
          </Button>
        </div>
      </div>

      {/* RIGHT: Preview Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 order-1 md:order-2 h-1/2 md:h-full bg-[#fdfbf7] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
        
        {/* Desktop Admin Link */}
        {onAdminClick && (
          <div className="hidden md:block absolute top-8 right-8">
            <Button variant="ghost" size="sm" className="text-stone-400 hover:text-emerald-500" onClick={onAdminClick}>
              Admin Access
            </Button>
          </div>
        )}

        {/* Canvas Wrapper */}
        <div className="relative w-full max-w-lg aspect-square">
          <div className="absolute -inset-4 bg-white/50 rounded-[3rem] blur-xl"></div>
          <Canvas 
            categories={data.categories} 
            assets={data.assets} 
            characterState={character} 
            className="w-full h-full shadow-2xl shadow-emerald-900/10 ring-8 ring-white rounded-[2.5rem]"
          />
        </div>

        {/* CTA */}
        <div className="mt-10 flex gap-4 z-10">
          <Button size="lg" onClick={handleDownload} isLoading={isDownloading} className="px-10 py-4 text-lg shadow-xl shadow-emerald-200 hover:shadow-2xl hover:shadow-emerald-300 hover:-translate-y-1">
            <Download className="w-6 h-6 mr-3" /> Download Character
          </Button>
        </div>

        <div className="mt-6 text-xs font-medium text-stone-400 text-center max-w-xs bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm">
           ✨ Mix and match to create your unique character!
        </div>
      </div>

    </div>
  );
};