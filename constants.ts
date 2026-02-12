
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
  // Original Badges
  { id: 'first_checkin', icon: '🏳️', name: 'Primeiro Passo', description: 'Fez o primeiro check-in' },
  { id: 'night_owl', icon: '🦉', name: 'Coruja', description: 'Check-in após as 02:00' },
  { id: 'party_animal', icon: '🎉', name: 'Inimigo do Fim', description: '3 Check-ins na mesma noite' },
  { id: 'critic', icon: '✍️', name: 'Crítico Michelin', description: 'Escreveu 5 comentários' },
  { id: 'trendsetter', icon: '🔥', name: 'Influencer', description: 'Descobriu um local novo' },

  // Gamification 2.0 - New Badges
  { id: 'enemy_of_dawn', icon: '🌙', name: 'Inimigo da Madrugada', description: 'Check-in após as 04:00' },
  { id: 'nomad', icon: '🗺️', name: 'Nômade', description: 'Visitou 10+ locais diferentes' },
  { id: 'foodie', icon: '🍽️', name: 'Crítico Gastronômico', description: '10+ reviews em restaurantes' },
  { id: 'regional_king_north', icon: '👑', name: 'Rei do Norte', description: 'Dominou a região Norte' },
  { id: 'regional_king_south', icon: '👑', name: 'Rei do Sul', description: 'Dominou a região Sul' },
  { id: 'regional_king_center', icon: '👑', name: 'Rei do Centro', description: 'Dominou a região Central' },
  { id: 'early_bird', icon: '⏰', name: 'Madrugadão', description: '5+ check-ins entre 2am-6am' },
  { id: 'social_butterfly', icon: '🦋', name: 'Borboleta Social', description: 'Convidou 5+ amigos' },
  { id: 'verified_helper', icon: '✅', name: 'Verificador', description: 'Ajudou a verificar 10+ locais' },
  { id: 'photo_pro', icon: '📸', name: 'Fotógrafo', description: 'Enviou 20+ fotos' },
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
    description: 'Baladas e Pubs fervendo',
    color: 'from-orange-500 to-red-500',
    filters: { minVibe: true, lowCost: false, minCrowd: 2.3, types: [LocationType.BALADA, LocationType.PUB], maxDistance: 10, onlyOpen: false }
  },
  {
    id: 'jantar',
    label: '🍽️ Gastronomia',
    description: 'Restaurantes e Bistrôs',
    color: 'from-yellow-500 to-orange-400',
    filters: { minVibe: false, lowCost: false, types: [LocationType.RESTAURANTE], maxDistance: 10, onlyOpen: false }
  },
  {
    id: 'date',
    label: '💘 Date',
    description: 'Bares e Restaurantes intimistas',
    color: 'from-pink-500 to-rose-500',
    filters: { minVibe: true, lowCost: false, maxCrowd: 2.3, types: [LocationType.BAR, LocationType.RESTAURANTE], maxDistance: 10, onlyOpen: false }
  },
  {
    id: 'economico',
    label: '💸 Fim de Mês',
    description: 'Preços baixos em qualquer lugar',
    color: 'from-green-500 to-emerald-600',
    filters: { minVibe: false, lowCost: true, types: [], maxDistance: 10, onlyOpen: false }
  },
  {
    id: 'resenha',
    label: '💬 Resenha',
    description: 'Bares e Pubs para conversar',
    color: 'from-blue-500 to-cyan-500',
    filters: { minVibe: false, lowCost: false, maxCrowd: 1.8, types: [LocationType.BAR, LocationType.PUB], maxDistance: 10, onlyOpen: false }
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

// --- HEATMAP VISUAL CONSTANTS ---

export const HEATMAP_COLORS = {
  FERVENDO: {
    gradient: 'from-red-500 via-orange-500 to-yellow-500',
    glow: 'rgba(239, 68, 68, 0.6)', // red-500 with opacity
    border: '#ef4444',
    pulse: true
  },
  ANIMADO: {
    gradient: 'from-yellow-500 to-amber-500',
    glow: 'rgba(234, 179, 8, 0.5)', // yellow-500 with opacity
    border: '#eab308',
    pulse: false
  },
  TRANQUILO: {
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59, 130, 246, 0.4)', // blue-500 with opacity
    border: '#3b82f6',
    pulse: false
  },
  ANTIGO: {
    gradient: 'from-slate-600 to-slate-700',
    glow: 'rgba(71, 85, 105, 0.3)', // slate-600 with opacity
    border: '#475569',
    pulse: false
  }
};

export const getHeatmapIntensity = (avgCrowd: number, avgVibe: number, lastUpdated?: string | Date) => {
  // Check if data is stale (>4 hours)
  if (lastUpdated) {
    const diff = Date.now() - new Date(lastUpdated).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours >= 4) return HEATMAP_COLORS.ANTIGO;
  }

  // No data
  if (avgCrowd === 0 && avgVibe === 0) return HEATMAP_COLORS.ANTIGO;

  // Calculate combined intensity (weighted: 60% crowd, 40% vibe)
  const intensity = (avgCrowd * 0.6) + (avgVibe * 0.4);

  if (intensity > 2.3) return HEATMAP_COLORS.FERVENDO;
  if (intensity > 1.6) return HEATMAP_COLORS.ANIMADO;
  return HEATMAP_COLORS.TRANQUILO;
};