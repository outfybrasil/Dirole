
import { LocationType, Filters, Badge } from './types';

// Curitiba Center
export const INITIAL_CENTER = {
  lat: -25.4284,
  lng: -49.2733
};

export const MOCK_USER_ID = 'user_123';

export const LOCATION_ICONS: Record<LocationType, string> = {
  [LocationType.BAR]: 'fa-cocktail',
  [LocationType.BALADA]: 'fa-music',
  [LocationType.PUB]: 'fa-beer',
  [LocationType.RESTAURANTE]: 'fa-utensils',
  [LocationType.OUTRO]: 'fa-map-pin'
};

// --- DEFAULT IMAGES ---
export const DEFAULT_LOCATION_IMAGES: Record<LocationType, string> = {
  [LocationType.BAR]: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop', // Cocktail Bar
  [LocationType.PUB]: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=800&auto=format&fit=crop', // Classic Pub
  [LocationType.BALADA]: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=800&auto=format&fit=crop', // Nightclub/Party
  [LocationType.RESTAURANTE]: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop', // Restaurant
  [LocationType.OUTRO]: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop' // Generic Social
};

// --- GAMIFICATION CONSTANTS ---

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, label: 'Novato' },
  { level: 2, xp: 100, label: 'Explorador' },
  { level: 3, xp: 300, label: 'Rolezeiro' },
  { level: 4, xp: 600, label: 'VIP' },
  { level: 5, xp: 1000, label: 'Lenda Urbana' },
];

export const BADGES: Badge[] = [
  { id: 'first_checkin', icon: '🏳️', name: 'Primeiro Passo', description: 'Fez o primeiro check-in' },
  { id: 'night_owl', icon: '🦉', name: 'Coruja', description: 'Check-in após as 02:00' },
  { id: 'party_animal', icon: '🎉', name: 'Inimigo do Fim', description: '3 Check-ins na mesma noite' },
  { id: 'critic', icon: '✍️', name: 'Crítico Michelin', description: 'Escreveu 5 comentários' },
  { id: 'trendsetter', icon: '🔥', name: 'Influencer', description: 'Descobriu um local novo' },
];

// --- MOODS ---

export interface Mood {
  id: string;
  label: string;
  description: string;
  color: string;
  filters: Filters;
}

export const MOOD_PRESETS: Mood[] = [
  {
    id: 'agito',
    label: '🔥 Agito',
    description: 'Baladas e Pubs lotados',
    color: 'from-orange-500 to-red-500',
    filters: { minVibe: true, lowCost: false, types: [LocationType.BALADA, LocationType.PUB], maxDistance: 5, onlyOpen: false }
  },
  {
    id: 'jantar',
    label: '🍽️ Gastronomia',
    description: 'Restaurantes e Bistrôs',
    color: 'from-yellow-500 to-orange-400',
    filters: { minVibe: false, lowCost: false, types: [LocationType.RESTAURANTE], maxDistance: 5, onlyOpen: false }
  },
  {
    id: 'date',
    label: '💘 Date',
    description: 'Bares e Restaurantes intimistas',
    color: 'from-pink-500 to-rose-500',
    filters: { minVibe: true, lowCost: false, types: [LocationType.BAR, LocationType.RESTAURANTE], maxDistance: 5, onlyOpen: false }
  },
  {
    id: 'economico',
    label: '💸 Fim de Mês',
    description: 'Preços baixos em qualquer lugar',
    color: 'from-green-500 to-emerald-600',
    filters: { minVibe: false, lowCost: true, types: [], maxDistance: 5, onlyOpen: false }
  },
  {
    id: 'resenha',
    label: '💬 Resenha',
    description: 'Bares e Pubs para conversar',
    color: 'from-blue-500 to-cyan-500',
    filters: { minVibe: false, lowCost: false, types: [LocationType.BAR, LocationType.PUB], maxDistance: 5, onlyOpen: false }
  }
];

// Helpers
export const getPriceIcon = (val: number) => {
  if (val === 0) return '❓';
  if (val <= 1.6) return '💰';
  if (val <= 2.3) return '💰💰';
  return '💰💰💰';
};

export const getCrowdIcon = (val: number) => {
  if (val === 0) return '⚪';
  if (val <= 1.6) return '🟢'; // Vazio
  if (val <= 2.3) return '🟡'; // Moderado
  return '🔴'; // Lotado
};

export const getGenderIcon = (val: number) => {
  if (val === 0) return '❓';
  if (val <= 1.6) return '🧑'; // Masc
  if (val <= 2.3) return '🚻'; // Balanced
  return '👩'; // Fem
};

export const getVibeIcon = (val: number) => {
  if (val === 0) return '❓';
  if (val <= 1.6) return '⭐'; // Padrao
  if (val <= 2.3) return '⭐⭐'; // Agradavel
  return '⭐⭐⭐'; // UAU
};

export const getVibeLabel = (val: number) => {
  if (val === 0) return 'Sem dados';
  if (val <= 1.6) return 'Padrão';
  if (val <= 2.3) return 'Agradável';
  return 'UAU!';
};