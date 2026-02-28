import type { LucideIcon } from 'lucide-react';
import {
  Image,
  Shirt,
  Palette,
  Sparkles,
  Smile,
  Layers,
  Mountain,
} from 'lucide-react';

const iconByKey: Array<{ keys: string[]; icon: LucideIcon }> = [
  { keys: ['background', '背景', 'sky', '天空'], icon: Image },
  { keys: ['body', '身体', 'body type'], icon: Shirt },
  { keys: ['skin', '皮肤', '肤色'], icon: Palette },
  { keys: ['hair', '头发', '发型'], icon: Sparkles },
  { keys: ['face', '脸', '面部', '表情'], icon: Smile },
  { keys: ['outfit', '衣服', '服装'], icon: Shirt },
  { keys: ['accessory', '配件', '装饰'], icon: Sparkles },
  { keys: ['scene', '场景'], icon: Mountain },
];

const defaultIcon = Layers;

/** Return a minimalist icon for a category (by name). Used in category tabs. */
export function getCategoryIcon(categoryName: string): LucideIcon {
  const lower = categoryName.toLowerCase().trim();
  for (const { keys, icon } of iconByKey) {
    if (keys.some((k) => lower.includes(k.toLowerCase()))) return icon;
  }
  return defaultIcon;
}
