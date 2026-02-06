export interface Category {
  id: string;
  name: string;
  zIndex: number;
  defaultAssetId?: string; // Optional ID of the default asset for this category
}

export interface Asset {
  id: string;
  name: string;
  categoryId: string;
  src: string; // Data URL or Image URL
}

export interface Card {
  id: string;
  name: string;
  src: string; // Public URL
  isDefault?: boolean;
}

export type MaskShape = 'square' | 'circle';

export interface Preset {
  id: string;
  name: string;
  characterState: CharacterState;
  cardId?: string;
  maskShape: MaskShape;
  cardTextTitle?: string;
  cardTextBody?: string;
  createdAt: string;
}

export interface AppData {
  categories: Category[];
  assets: Asset[];
  cards?: Card[]; // Optional cards array
}

export type CharacterState = Record<string, string>; // categoryId -> assetId

export enum View {
  CONFIGURATOR = 'CONFIGURATOR',
  ADMIN = 'ADMIN',
  USER_PROFILE = 'USER_PROFILE',
}