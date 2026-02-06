import React, { useMemo } from 'react';
import { Asset, Category, CharacterState, MaskShape } from '../types';
import { CARD_TITLE_FONT_FAMILY, CARD_BODY_FONT_FAMILY } from '../constants/cardTheme';
import { sortCategoriesByZIndex } from '../utils/categories';

interface CanvasProps {
  categories: Category[];
  assets: Asset[];
  characterState: CharacterState;
  className?: string;
  width?: number;
  height?: number;
  id?: string;
  // Card props
  cardSrc?: string;
  maskShape?: MaskShape;
  cardTextTitle?: string;
  cardTextBody?: string;
  // 3D tilt effect
  enableTilt?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  categories,
  assets,
  characterState,
  className = "",
  width = 800,
  height = 800,
  id,
  cardSrc,
  maskShape = 'square',
  cardTextTitle,
  cardTextBody,
  enableTilt = false
}) => {
  const sortedCategories = useMemo(() => sortCategoriesByZIndex(categories), [categories]);

  const hasCard = !!cardSrc;
  const aspectRatio = hasCard ? '3/4' : '1/1';

  // 角色区域：有卡牌时为正方形，略下移与顶部留距，圆形/菱形遮罩略缩小以贴合角色
  const characterMaskStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { zIndex: 10 };
    if (!hasCard) {
      return { ...base, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' };
    }
    return {
      ...base,
      position: 'absolute',
      top: '15%',
      left: '50%',
      width: '100%',
      height: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  const getMaskClip = (shape: MaskShape) => {
    if (shape === 'circle') {
      return { clipPath: 'circle(40% at 50% 50%)' };
    }
    return {};
  };

  // 内层：严格正方形（宽高取短边），保证圆形是正圆不被压成椭圆
  const innerSquareStyle = (): React.CSSProperties => {
    if (!hasCard) return {};
    return {
      position: 'relative',
      width: '100%',
      maxHeight: '100%',
      aspectRatio: '1',
      flexShrink: 0,
      ...getMaskClip(maskShape),
    };
  };

  return (
    <div
      id={id}
      className={`relative bg-white overflow-hidden ${className} ${enableTilt ? 'card-tilt' : ''}`}
      style={{
        aspectRatio,
        maxWidth: '100%',
        maxHeight: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
        borderRadius: '1rem',
      }}
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      />

      {hasCard && (
        <img
          src={cardSrc}
          alt="Card background"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: 0, borderRadius: 'inherit' }}
        />
      )}

      <div style={characterMaskStyle()}>
        <div style={innerSquareStyle()} className="overflow-hidden">
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
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ zIndex: cat.zIndex }}
              />
            );
          })}
        </div>
      </div>

      {hasCard && (
        <div
          className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center p-6 pointer-events-none"
          style={{ height: '50%', zIndex: 20 }}
        >
          {cardTextTitle && (
            <h2
              className="text-3xl md:text-4xl font-bold text-stone-800 mb-3 text-center w-full"
              style={{ fontFamily: CARD_TITLE_FONT_FAMILY }}
            >
              {cardTextTitle}
            </h2>
          )}
          {cardTextBody && (
            <p
              className="text-sm text-stone-600 text-center max-w-xs whitespace-pre-line"
              style={{ fontFamily: CARD_BODY_FONT_FAMILY }}
            >
              {cardTextBody}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
