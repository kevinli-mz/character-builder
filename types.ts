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

export interface AppData {
  categories: Category[];
  assets: Asset[];
}

export type CharacterState = Record<string, string>; // categoryId -> assetId

export enum View {
  CONFIGURATOR = 'CONFIGURATOR',
  ADMIN = 'ADMIN',
}