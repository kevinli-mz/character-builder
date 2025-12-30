import React from 'react';
import { Asset, Category, CharacterState } from '../types';

interface CanvasProps {
  categories: Category[];
  assets: Asset[];
  characterState: CharacterState;
  className?: string;
  width?: number;
  height?: number;
  id?: string;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  categories, 
  assets, 
  characterState, 
  className = "",
  width = 800,
  height = 800,
  id
}) => {
  // Sort categories by zIndex
  const sortedCategories = [...categories].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div 
      id={id}
      className={`relative bg-white shadow-lg rounded-lg overflow-hidden ${className}`}
      style={{ 
        aspectRatio: `${width}/${height}`,
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    >
      {/* Base layer placeholder/checkerboard for transparency indication */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
             backgroundSize: '20px 20px',
             backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
           }} 
      />

      {sortedCategories.map(cat => {
        const assetId = characterState[cat.id];
        if (!assetId) return null;
        
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return null;

        return (
          <img
            key={cat.id}
            src={asset.src}
            alt={`${cat.name} layer`}
            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: cat.zIndex }}
          />
        );
      })}
    </div>
  );
};
