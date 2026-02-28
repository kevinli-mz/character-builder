import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppData, Asset, Category, CharacterState, Card, MaskShape, Preset } from '../types';
import { Canvas } from './Canvas';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Download, Shuffle, RotateCcw, Lock, Save, Square, Circle, Edit2, User, GraduationCap } from 'lucide-react';
import { fetchCards, savePreset } from '../services/api';
import { sortCategoriesByZIndex } from '../utils/categories';
import { CARD_TITLE_FONT_FAMILY, CARD_BODY_FONT_FAMILY } from '../constants/cardTheme';

interface ConfiguratorProps {
  data: AppData;
  onAdminClick?: () => void;
  onProfileClick?: () => void;
}

function saveConfiguratorStateToSession(state: {
  character: CharacterState;
  selectedCardId?: string;
  maskShape: MaskShape;
  cardTextTitle: string;
  cardTextBody: string;
}) {
  try {
    sessionStorage.setItem('configuratorState', JSON.stringify(state));
  } catch (e) {
    console.warn('保存编辑状态失败', e);
  }
}

export const Configurator: React.FC<ConfiguratorProps> = ({ data, onAdminClick, onProfileClick }) => {
  const [character, setCharacter] = useState<CharacterState>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Card state
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>();
  const [maskShape, setMaskShape] = useState<MaskShape>('square');
  const [cardTextTitle, setCardTextTitle] = useState<string>('');
  const [cardTextBody, setCardTextBody] = useState<string>('');
  const [isEditingText, setIsEditingText] = useState(false);
  
  // Save preset modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sortedCategories = useMemo(() => sortCategoriesByZIndex(data.categories), [data.categories]);

  // 3D tilt effect（平滑插值）
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const tiltTarget = useRef({ x: 0, y: 0 });
  const tiltCurrent = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  // Load cards on mount — no default card; user selects if they want one
  useEffect(() => {
    const loadCards = async () => {
      const loadedCards = await fetchCards();
      setCards(loadedCards);
    };
    loadCards();
  }, []);

  // 进入用户面板前保存当前编辑状态；返回时仅在有 loadPreset 时加载预设，否则恢复保存的状态
  useEffect(() => {
    const loadPresetData = sessionStorage.getItem('loadPreset');
    const savedState = sessionStorage.getItem('configuratorState');
    if (loadPresetData) {
      try {
        const preset: Preset = JSON.parse(loadPresetData);
        setCharacter(preset.characterState);
        setSelectedCardId(preset.cardId);
        setMaskShape(preset.maskShape === 'circle' ? 'circle' : 'square');
        setCardTextTitle(preset.cardTextTitle || '');
        setCardTextBody(preset.cardTextBody || '');
        sessionStorage.removeItem('loadPreset');
        sessionStorage.removeItem('configuratorState');
      } catch (error) {
        console.error('加载预设失败:', error);
        sessionStorage.removeItem('loadPreset');
      }
    } else if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.character && Object.keys(state.character).length > 0) setCharacter(state.character);
        if (state.selectedCardId !== undefined) setSelectedCardId(state.selectedCardId);
        if (state.maskShape === 'circle' || state.maskShape === 'square') setMaskShape(state.maskShape);
        if (state.cardTextTitle !== undefined) setCardTextTitle(state.cardTextTitle);
        if (state.cardTextBody !== undefined) setCardTextBody(state.cardTextBody);
        sessionStorage.removeItem('configuratorState');
      } catch (e) {
        sessionStorage.removeItem('configuratorState');
      }
    }
  }, []);

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

  // 3D tilt effect：平滑过渡
  useEffect(() => {
    if (!selectedCardId || !canvasRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      tiltTarget.current = {
        x: (y - centerY) / 12,
        y: (centerX - x) / 12,
      };
    };

    const handleMouseLeave = () => {
      tiltTarget.current = { x: 0, y: 0 };
    };

    const animate = () => {
      const smooth = 0.15;
      tiltCurrent.current.x += (tiltTarget.current.x - tiltCurrent.current.x) * smooth;
      tiltCurrent.current.y += (tiltTarget.current.y - tiltCurrent.current.y) * smooth;
      setTiltStyle({
        transform: `perspective(1000px) rotateX(${tiltCurrent.current.x}deg) rotateY(${tiltCurrent.current.y}deg)`,
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    canvasRef.current.addEventListener('mousemove', handleMouseMove);
    canvasRef.current.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove);
      canvasRef.current?.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [selectedCardId]);

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
    setSelectedCardId(cards.find(c => c.isDefault)?.id);
    setMaskShape('square');
    setCardTextTitle('');
    setCardTextBody('');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const selectedCard = cards.find(c => c.id === selectedCardId);
      const hasCard = !!selectedCard;
      
      // Create a temporary canvas
      const canvas = document.createElement('canvas');
      if (hasCard) {
        // Card dimensions: vertical rectangle (3:4 ratio)
        canvas.width = 1000;
        canvas.height = Math.round(1000 * 4 / 3);
      } else {
        // Character only: square
        canvas.width = 1000;
        canvas.height = 1000;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw card background if equipped
      if (hasCard && selectedCard) {
        await new Promise<void>((resolve, reject) => {
          const cardImg = new Image();
          cardImg.crossOrigin = 'anonymous';
          cardImg.onload = () => {
            ctx.drawImage(cardImg, 0, 0, canvas.width, canvas.height);
            resolve();
          };
          cardImg.onerror = reject;
          cardImg.src = selectedCard.src;
        });
      }

      // 角色绘制：与预览一致 — 有卡牌时角色区域为 top 15%，高度 50%，正方形
      const sortedCategories = sortCategoriesByZIndex(data.categories);
      const topOffset = hasCard ? Math.floor(canvas.height * 0.15) : 0;
      const characterAreaHeight = hasCard ? canvas.height * 0.50 : canvas.height;
      const charSize = Math.min(canvas.width, Math.floor(characterAreaHeight));
      const charX = (canvas.width - charSize) / 2;
      const charY = hasCard ? topOffset : 0;

      const charCanvas = document.createElement('canvas');
      charCanvas.width = charSize;
      charCanvas.height = charSize;
      const charCtx = charCanvas.getContext('2d');
      if (!charCtx) return;

      for (const cat of sortedCategories) {
        const assetId = character[cat.id];
        if (!assetId) continue;
        const asset = data.assets.find(a => a.id === assetId);
        if (!asset) continue;
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            charCtx.drawImage(img, 0, 0, charSize, charSize);
            resolve();
          };
          img.onerror = reject;
          img.src = asset.src;
        });
      }

      // Circle mask: match preview circle(50% at 50% 50%) — radius 50% of character square so preview and export match
      if (hasCard && maskShape !== 'square') {
        charCtx.globalCompositeOperation = 'destination-in';
        charCtx.fillStyle = '#000';
        charCtx.beginPath();
        const cx = charSize / 2;
        const cy = charSize / 2;
        if (maskShape === 'circle') {
          const r = charSize * 0.5;
          charCtx.arc(cx, cy, r, 0, Math.PI * 2);
        }
        charCtx.fill();
        charCtx.globalCompositeOperation = 'source-over';
      }

      ctx.drawImage(charCanvas, charX, charY, charSize, charSize);

      // Draw text if card is equipped — sizes scaled to match preview (text-3xl/4xl ≈ 72px, text-sm ≈ 28px at 1000px width)
      if (hasCard) {
        ctx.fillStyle = '#1c1917';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const titleFont = CARD_TITLE_FONT_FAMILY && CARD_TITLE_FONT_FAMILY !== 'inherit'
          ? `bold 72px ${CARD_TITLE_FONT_FAMILY}`
          : 'bold 72px sans-serif';
        const bodyFont = CARD_BODY_FONT_FAMILY && CARD_BODY_FONT_FAMILY !== 'inherit'
          ? `28px ${CARD_BODY_FONT_FAMILY}`
          : '28px sans-serif';

        const textY = canvas.height * 0.75;
        const titleOffset = 48;
        const bodyLineHeight = 36;

        if (cardTextTitle) {
          ctx.font = titleFont;
          ctx.fillText(cardTextTitle, canvas.width / 2, textY - titleOffset);
        }

        if (cardTextBody) {
          ctx.font = bodyFont;
          const maxWidth = canvas.width * 0.8;
          const lines = cardTextBody.split(/\r?\n/);
          let y = textY + 36;
          for (const line of lines) {
            const words = line.trim().split(/\s+/);
            let currentLine = '';
            for (let n = 0; n < words.length; n++) {
              const testLine = currentLine ? currentLine + ' ' + words[n] : words[n];
              const metrics = ctx.measureText(testLine);
              if (metrics.width > maxWidth && currentLine) {
                ctx.fillText(currentLine, canvas.width / 2, y);
                currentLine = words[n];
                y += bodyLineHeight;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) {
              ctx.fillText(currentLine, canvas.width / 2, y);
              y += bodyLineHeight;
            }
          }
        }
      }

      // Trigger download
      const link = document.createElement('a');
      link.download = hasCard ? `my-card-${Date.now()}.png` : `my-peep-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Download failed", error);
      alert("无法生成图片，请重试。");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      alert('请输入预设名称');
      return;
    }
    
    setIsSaving(true);
    try {
      await savePreset(
        presetName.trim(),
        character,
        selectedCardId,
        maskShape,
        cardTextTitle || undefined,
        cardTextBody || undefined
      );
      setSaveSuccess(true);
      setPresetName('');
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('保存预设失败:', error);
      alert('保存预设失败，请重试。');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const assetsForActiveCategory = data.assets.filter(a => a.categoryId === activeCategory);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#fdfbf7] overflow-hidden text-stone-700">
      
      {/* Mobile Header */}
      <div className="md:hidden p-4 bg-white/80 backdrop-blur border-b border-stone-200 flex justify-between items-center z-20 sticky top-0">
        <h1 className="font-bold text-lg text-stone-800 flex items-center gap-2">
           <span className="bg-emerald-400 text-white px-2 py-0.5 rounded-lg rotate-3 text-sm flex items-center justify-center"><GraduationCap className="w-4 h-4" /></span>
           本子的装扮屋
        </h1>
        <div className="flex gap-2">
          {onProfileClick && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                saveConfiguratorStateToSession({
                  character,
                  selectedCardId,
                  maskShape,
                  cardTextTitle,
                  cardTextBody,
                });
                onProfileClick();
              }}
              className="rounded-full w-10 h-10 p-0"
              title="个人中心"
            >
              <User className="w-6 h-6 text-stone-600" />
            </Button>
          )}
          {onAdminClick && (
            <Button size="sm" variant="ghost" onClick={onAdminClick}><Lock className="w-4 h-4"/></Button>
          )}
        </div>
      </div>

      {/* LEFT: 角色编辑器 */}
      <div className="flex flex-col md:w-1/3 lg:w-[28rem] md:shrink-0 bg-white border-r border-stone-200 z-10 shadow-2xl md:shadow-stone-200/50 order-2 md:order-1 h-1/2 md:h-full">
        
        {/* Category Tabs — Chinese labels */}
        <div className="flex overflow-x-auto p-4 border-b border-stone-100 gap-2 scrollbar-hide bg-white">
          {sortedCategories.map(cat => (
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
               <span className="text-xs text-stone-400 font-bold">无</span>
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
               此分类中暂无资产。
             </div>
          )}
        </div>

        {/* Card Selection Section */}
        <div className="p-4 border-t border-stone-100 bg-white overflow-y-auto">
          <div className="mb-3">
            <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">卡牌设计</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCardId(undefined)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !selectedCardId
                    ? 'bg-emerald-400 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                无
              </button>
              {cards.map(card => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCardId === card.id
                      ? 'bg-emerald-400 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {card.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mask Shape Selection */}
          {selectedCardId && (
            <div className="mb-3">
              <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">形状遮罩</label>
              <div className="flex gap-2">
                {(['square', 'circle'] as MaskShape[]).map(shape => (
                  <button
                    key={shape}
                    onClick={() => setMaskShape(shape)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      maskShape === shape
                        ? 'bg-emerald-400 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {shape === 'square' && <Square className="w-4 h-4" />}
                    {shape === 'circle' && <Circle className="w-4 h-4" />}
                    <span className="hidden sm:inline">
                      {shape === 'square' ? '方形' : '圆形'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Editing */}
          {selectedCardId && (
            <div className="mb-3">
              <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">卡牌文本</label>
              <button
                onClick={() => setIsEditingText(!isEditingText)}
                className="w-full px-4 py-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {isEditingText ? '完成编辑' : '编辑文本'}
              </button>
              {isEditingText && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    placeholder="输入标题..."
                    value={cardTextTitle}
                    onChange={(e) => setCardTextTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <textarea
                    placeholder="输入正文..."
                    value={cardTextBody}
                    onChange={(e) => setCardTextBody(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-6 border-t border-stone-100 bg-white flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
          <Button variant="secondary" className="flex-1 rounded-2xl" onClick={handleRandomize} title="随机生成">
            <Shuffle className="w-5 h-5 mr-2 text-emerald-500" /> 随机
          </Button>
          <Button variant="ghost" className="rounded-2xl bg-stone-50" onClick={handleReset} title="重置为默认">
            <RotateCcw className="w-5 h-5 text-stone-400" />
          </Button>
        </div>
      </div>

      {/* RIGHT: 预览区 */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 md:p-8 order-1 md:order-2 h-1/2 md:h-full bg-[#fdfbf7] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] min-w-0">
        
        {/* Desktop Header */}
        <div className="hidden md:flex absolute top-8 right-8 gap-2 z-20">
          {onProfileClick && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full w-12 h-12 p-0"
              onClick={() => {
                saveConfiguratorStateToSession({
                  character,
                  selectedCardId,
                  maskShape,
                  cardTextTitle,
                  cardTextBody,
                });
                onProfileClick();
              }}
              title="个人中心"
            >
              <User className="w-8 h-8 text-stone-600" />
            </Button>
          )}
          {onAdminClick && (
            <Button variant="ghost" size="sm" className="text-stone-400 hover:text-emerald-500" onClick={onAdminClick}>
              管理面板
            </Button>
          )}
        </div>

        {/* Canvas Wrapper（缩小卡牌占屏，去掉与比例不符的 ring 边框） */}
        <div
          ref={canvasRef}
          className="relative w-full max-w-md"
          style={{ aspectRatio: selectedCardId ? '3/4' : '1/1', ...tiltStyle }}
        >
          <div className="absolute -inset-2 bg-white/40 rounded-2xl blur-xl" />
          <Canvas
            categories={data.categories}
            assets={data.assets}
            characterState={character}
            cardSrc={selectedCard?.src}
            maskShape={maskShape}
            cardTextTitle={cardTextTitle}
            cardTextBody={cardTextBody}
            enableTilt={!!selectedCardId}
            className="w-full h-full rounded-2xl"
          />
        </div>

        {/* CTA */}
        <div className="mt-10 flex gap-4 z-10">
          <Button size="lg" onClick={handleDownload} isLoading={isDownloading} className="px-10 py-4 text-lg shadow-xl shadow-emerald-200 hover:shadow-2xl hover:shadow-emerald-300 hover:-translate-y-1">
            <Download className="w-6 h-6 mr-3" /> 下载{selectedCardId ? '卡牌' : '角色'}
          </Button>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => setShowSaveModal(true)}
            className="px-10 py-4 text-lg shadow-xl shadow-emerald-200 hover:shadow-2xl hover:shadow-emerald-300 hover:-translate-y-1"
          >
            <Save className="w-6 h-6 mr-3" /> 保存预设
          </Button>
        </div>

        <div className="mt-6 text-xs font-medium text-stone-400 text-center max-w-xs bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm">
           ✨ 自由搭配，创造属于你的独特角色！
        </div>
      </div>

      {/* Save Preset Modal */}
      <Modal isOpen={showSaveModal} onClose={() => !isSaving && setShowSaveModal(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-stone-800 mb-4">保存预设</h2>
          {saveSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium text-stone-700">预设保存成功！</p>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="输入预设名称..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSavePreset()}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSaving}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSavePreset}
                  isLoading={isSaving}
                  disabled={!presetName.trim()}
                  className="flex-1"
                >
                  保存
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
