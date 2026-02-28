import React, { useState, useEffect } from 'react';
import { Preset, CharacterState, MaskShape } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { ArrowLeft, Trash2, LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserPresets, deletePreset, loadPreset } from '../services/api';
import { fetchCards } from '../services/api';
import { Card } from '../types';

interface UserProfileProps {
  onClose: () => void;
  onLoadPreset?: (preset: Preset) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onClose, onLoadPreset }) => {
  const { user, signOut } = useAuth();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; presetId: string; presetName: string }>({
    isOpen: false,
    presetId: '',
    presetName: ''
  });

  useEffect(() => {
    loadPresets();
    loadCards();
  }, []);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const userPresets = await getUserPresets();
      setPresets(userPresets);
    } catch (error) {
      console.error('加载预设失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCards = async () => {
    try {
      const loadedCards = await fetchCards();
      setCards(loadedCards);
    } catch (error) {
      console.error('加载卡牌失败:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePreset(deleteModal.presetId);
      setPresets(presets.filter(p => p.id !== deleteModal.presetId));
      setDeleteModal({ isOpen: false, presetId: '', presetName: '' });
    } catch (error) {
      console.error('删除预设失败:', error);
      alert('删除预设失败，请重试。');
    }
  };

  const handleLoadPreset = async (preset: Preset) => {
    if (onLoadPreset) {
      onLoadPreset(preset);
      onClose();
    }
  };

  const getCardName = (cardId?: string) => {
    if (!cardId) return '无';
    const card = cards.find(c => c.id === cardId);
    return card?.name || '未知';
  };

  const getMaskShapeName = (shape: MaskShape | string) => {
    switch (shape) {
      case 'square': return '方形';
      case 'circle': return '圆形';
      case 'rounded_rect': return '圆角矩形';
      case 'diamond': return '菱形';
      default: return '方形';
    }
  };

  return (
    <div className="h-screen w-screen bg-[#fdfbf7] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-stone-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-stone-800">我的预设</h1>
            <p className="text-sm text-stone-500 mt-1">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={async () => {
            await signOut();
            onClose();
          }}
          className="text-stone-500 hover:text-rose-600 hover:bg-rose-50 shrink-0"
        >
          <LogOut className="w-4 h-4 mr-2" />
          登出
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-400 rounded-2xl mb-4 rotate-3 animate-pulse">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <p className="text-stone-400">加载中...</p>
            </div>
          </div>
        ) : presets.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-stone-600 mb-2">暂无预设</p>
              <p className="text-sm text-stone-400">在构建器中保存你的第一个预设吧！</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {presets.map(preset => (
              <div
                key={preset.id}
                className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Preview Area */}
                <div className="aspect-[3/4] bg-stone-50 relative">
                  {/* Placeholder for preset preview */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      {preset.cardTextTitle && (
                        <p className="text-sm font-bold text-stone-700 mb-1">{preset.cardTextTitle}</p>
                      )}
                      {preset.cardTextBody && (
                        <p className="text-xs text-stone-500">{preset.cardTextBody}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-stone-800 mb-2">{preset.name}</h3>
                  <div className="space-y-1 text-sm text-stone-600">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">卡牌:</span>
                      <span className="font-medium">{getCardName(preset.cardId)}</span>
                    </div>
                    {preset.cardId && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">形状:</span>
                        <span className="font-medium">{getMaskShapeName(preset.maskShape)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">创建时间:</span>
                      <span className="font-medium text-xs">
                        {new Date(preset.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="secondary"
                      onClick={() => handleLoadPreset(preset)}
                      className="flex-1"
                    >
                      加载
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setDeleteModal({
                        isOpen: true,
                        presetId: preset.id,
                        presetName: preset.name
                      })}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, presetId: '', presetName: '' })}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-stone-800 mb-4">删除预设</h2>
          <p className="text-stone-600 mb-6">
            确定要删除预设 <span className="font-bold">"{deleteModal.presetName}"</span> 吗？此操作无法撤销。
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, presetId: '', presetName: '' })}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleDelete}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
