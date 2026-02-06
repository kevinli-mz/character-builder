import type { Category } from '../types';

/** Sort categories by zIndex (ascending). Use wherever display order is needed. */
export function sortCategoriesByZIndex(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.zIndex - b.zIndex);
}
