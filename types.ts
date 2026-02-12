export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlockedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  age?: number;
  gender?: string;
  avatar: string;
  points: number;
  xp: number;
  level: number;
  badges: Badge[];
  favorites: string[];
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: Date;
}

export enum FriendshipStatus {
  NONE = 'none',
  PENDING_SENT = 'pending_sent',
  PENDING_RECEIVED = 'pending_received',
  ACCEPTED = 'accepted'
}

export interface FriendUser extends User {
  friendshipStatus: FriendshipStatus;
  friendshipId?: string;
  lastCheckIn?: string;
}

export interface Invite {
  id: string;
  fromUserId: string;
  toUserId: string;
  locationId: string;
  locationName: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export enum LocationType {
  BAR = 'Bar',
  BALADA = 'Balada',
  PUB = 'Pub',
  RESTAURANTE = 'Restaurante',
  OUTRO = 'Outro'
}

export interface Review {
  id?: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  locationId: string;
  price: number;
  crowd: number;
  gender: number;
  vibe: number;
  comment?: string;
  createdAt: Date;
}

export interface LocationEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  category: 'Show' | 'DJ' | 'Promo' | 'Karaoke' | 'Esporte';
  imageUrl?: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  userAvatar: string;
  userName: string;
  date: Date;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  imageUrl?: string;

  verified: boolean;
  votesForVerification: number;

  isOfficial?: boolean;
  ownerId?: string;
  officialDescription?: string;
  instagram?: string;
  whatsapp?: string;

  isOpen: boolean; // Novo campo
  openingHours?: string; // Novo campo opcional

  king?: {
    userId: string;
    userName: string;
    userAvatar: string;
    checkInCount: number;
  };

  stats: {
    avgPrice: number;
    avgCrowd: number;
    avgGender: number;
    avgVibe: number;
    lastUpdated: Date;
    reviewCount: number;
  };
  reviews: Review[];
  distance?: number;
}

export interface Filters {
  minVibe: boolean;
  lowCost: boolean;
  minCrowd?: number; // Novo: Lotação mínima
  maxCrowd?: number; // Novo: Lotação máxima
  types: LocationType[];
  maxDistance: number;
  onlyOpen: boolean;
}

export interface ActivityFeedItem {
  id: string;
  text: string;
  avatar: string;
  type: 'review' | 'checkin' | 'join';
}

export interface Report {
  targetId: string;
  targetType: 'location' | 'review' | 'photo' | 'user';
  reason: string;
  details: string;
  reporterId?: string;
}

export interface RouteStop {
  locationId: string;
  locationName: string;
  order: number;
}

export interface Route {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  name: string;
  description: string;
  stops: RouteStop[];
  likes: number;
  completions: number; // How many people finished it
}

// --- SOCIAL MATCH (VIBE CHECK) ---

export enum VibeType {
  DANCE = 'dance',
  DRINK = 'drink',
  FLIRT = 'flirt'
}

export interface UserVibe {
  userId: string;
  vibeType: VibeType;
  locationId?: string; // Optional: if they're already at a location
  createdAt: Date;
  expiresAt: Date; // Valid for 6 hours
}

export interface LocationVibeCount {
  locationId: string;
  danceCount: number;
  drinkCount: number;
  flirtCount: number;
  lastUpdated: Date;
}

// --- DIROLE STORIES ---

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userNickname?: string;
  userAvatar: string;
  locationId: string;
  locationName: string;
  photoUrl: string; // Appwrite Storage URL
  createdAt: Date;
  expiresAt: Date; // createdAt + 6h
  viewedBy: string[]; // Array of user IDs who viewed this story
}