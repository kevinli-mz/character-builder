/**
 * Editable category icons from 3 open-source libraries:
 * - Lucide (lucide-react)
 * - Heroicons 2 (react-icons/hi2)
 * - Material Design (react-icons/md)
 * Stored as "library:IconName" e.g. "lucide:Shirt", "hi2:UserCircle"
 */
import type { LucideIcon } from 'lucide-react';
import {
  Image,
  Shirt,
  Palette,
  Sparkles,
  Smile,
  Layers,
  Mountain,
  User,
  Circle,
  Box,
  Square,
  Heart,
  Star,
  Sun,
  Cloud,
  Leaf,
  Flower2,
  Gem,
} from 'lucide-react';
import {
  HiUserCircle,
  HiPhoto,
  HiSwatch,
  HiSparkles,
  HiFaceSmile,
  HiSquares2X2,
  HiUser,
  HiSquare2Stack,
  HiHeart,
  HiStar,
  HiSun,
  HiCloud,
} from 'react-icons/hi2';
import {
  MdFace,
  MdPalette,
  MdImage,
  MdAutoAwesome,
  MdPerson,
  MdLayers,
  MdCircle,
  MdCropSquare,
  MdFavorite,
  MdStars,
  MdWbSunny,
  MdCloud,
  MdPark,
  MdCategory,
} from 'react-icons/md';

export type IconLibrary = 'lucide' | 'hi2' | 'md';

export interface IconOption {
  id: string;
  library: IconLibrary;
  label: string;
  Component: React.ComponentType<{ className?: string; size?: number } & Record<string, unknown>>;
}

const lucideIcons: IconOption[] = [
  { id: 'lucide:Image', library: 'lucide', label: 'Image', Component: Image },
  { id: 'lucide:Shirt', library: 'lucide', label: 'Shirt', Component: Shirt },
  { id: 'lucide:Palette', library: 'lucide', label: 'Palette', Component: Palette },
  { id: 'lucide:Sparkles', library: 'lucide', label: 'Sparkles', Component: Sparkles },
  { id: 'lucide:Smile', library: 'lucide', label: 'Smile', Component: Smile },
  { id: 'lucide:Layers', library: 'lucide', label: 'Layers', Component: Layers },
  { id: 'lucide:Mountain', library: 'lucide', label: 'Mountain', Component: Mountain },
  { id: 'lucide:User', library: 'lucide', label: 'User', Component: User },
  { id: 'lucide:Circle', library: 'lucide', label: 'Circle', Component: Circle },
  { id: 'lucide:Box', library: 'lucide', label: 'Box', Component: Box },
  { id: 'lucide:Square', library: 'lucide', label: 'Square', Component: Square },
  { id: 'lucide:Heart', library: 'lucide', label: 'Heart', Component: Heart },
  { id: 'lucide:Star', library: 'lucide', label: 'Star', Component: Star },
  { id: 'lucide:Sun', library: 'lucide', label: 'Sun', Component: Sun },
  { id: 'lucide:Cloud', library: 'lucide', label: 'Cloud', Component: Cloud },
  { id: 'lucide:Leaf', library: 'lucide', label: 'Leaf', Component: Leaf },
  { id: 'lucide:Flower2', library: 'lucide', label: 'Flower', Component: Flower2 },
  { id: 'lucide:Gem', library: 'lucide', label: 'Gem', Component: Gem },
];

const hi2Icons: IconOption[] = [
  { id: 'hi2:UserCircle', library: 'hi2', label: 'User Circle', Component: HiUserCircle },
  { id: 'hi2:Photo', library: 'hi2', label: 'Photo', Component: HiPhoto },
  { id: 'hi2:Swatch', library: 'hi2', label: 'Swatch', Component: HiSwatch },
  { id: 'hi2:Sparkles', library: 'hi2', label: 'Sparkles', Component: HiSparkles },
  { id: 'hi2:FaceSmile', library: 'hi2', label: 'Face Smile', Component: HiFaceSmile },
  { id: 'hi2:Squares2X2', library: 'hi2', label: 'Layers', Component: HiSquares2X2 },
  { id: 'hi2:User', library: 'hi2', label: 'User', Component: HiUser },
  { id: 'hi2:Square2Stack', library: 'hi2', label: 'Stack', Component: HiSquare2Stack },
  { id: 'hi2:Heart', library: 'hi2', label: 'Heart', Component: HiHeart },
  { id: 'hi2:Star', library: 'hi2', label: 'Star', Component: HiStar },
  { id: 'hi2:Sun', library: 'hi2', label: 'Sun', Component: HiSun },
  { id: 'hi2:Cloud', library: 'hi2', label: 'Cloud', Component: HiCloud },
];

const mdIcons: IconOption[] = [
  { id: 'md:Face', library: 'md', label: 'Face', Component: MdFace },
  { id: 'md:Palette', library: 'md', label: 'Palette', Component: MdPalette },
  { id: 'md:Image', library: 'md', label: 'Image', Component: MdImage },
  { id: 'md:AutoAwesome', library: 'md', label: 'Sparkle', Component: MdAutoAwesome },
  { id: 'md:Person', library: 'md', label: 'Person', Component: MdPerson },
  { id: 'md:Layers', library: 'md', label: 'Layers', Component: MdLayers },
  { id: 'md:Circle', library: 'md', label: 'Circle', Component: MdCircle },
  { id: 'md:CropSquare', library: 'md', label: 'Square', Component: MdCropSquare },
  { id: 'md:Favorite', library: 'md', label: 'Heart', Component: MdFavorite },
  { id: 'md:Stars', library: 'md', label: 'Star', Component: MdStars },
  { id: 'md:WbSunny', library: 'md', label: 'Sun', Component: MdWbSunny },
  { id: 'md:Cloud', library: 'md', label: 'Cloud', Component: MdCloud },
  { id: 'md:Park', library: 'md', label: 'Park', Component: MdPark },
  { id: 'md:Category', library: 'md', label: 'Category', Component: MdCategory },
];

export const ICON_REGISTRY: IconOption[] = [...lucideIcons, ...hi2Icons, ...mdIcons];

const registryById = new Map(ICON_REGISTRY.map((o) => [o.id, o]));

/** Get the React component for an icon key (e.g. "lucide:Shirt"). Returns null if not found. */
export function getIconComponent(
  iconKey: string | undefined | null
): React.ComponentType<{ className?: string; size?: number } & Record<string, unknown>> | null {
  if (!iconKey) return null;
  const option = registryById.get(iconKey);
  return option ? option.Component : null;
}

/** Get full option for an icon key (for picker display). */
export function getIconOption(iconKey: string | undefined | null): IconOption | null {
  if (!iconKey) return null;
  return registryById.get(iconKey) ?? null;
}

export const ICON_LIBRARIES: { id: IconLibrary; label: string; icons: IconOption[] }[] = [
  { id: 'lucide', label: 'Lucide', icons: lucideIcons },
  { id: 'hi2', label: 'Heroicons', icons: hi2Icons },
  { id: 'md', label: 'Material', icons: mdIcons },
];
