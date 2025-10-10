// PLIIIZ Data Models & Types

export interface User {
  id: string;
  email: string;
  firstName: string;
  pseudo?: string;
  avatar?: string;
  language: 'fr' | 'en';
  country?: string;
  city?: string;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface Profile {
  userId: string;
  bio?: string;
  visibilityDefaults: {
    publicPreview: boolean;
    defaultSections: ProfileSection[];
  };
  eventTypes: EventType[];
}

export type ProfileSection = 
  | 'likes' 
  | 'dislikes' 
  | 'brands' 
  | 'colors' 
  | 'sizes' 
  | 'dietary' 
  | 'budgets' 
  | 'currentWants'
  | 'ethics';

export interface Preferences {
  userId: string;
  likes: Tag[];
  dislikes: Tag[];
  brands: string[];
  colors: string[];
  materials: string[];
  styles: string[];
  sizes: {
    top?: string;
    bottom?: string;
    shoes?: string;
    ring?: string;
    hat?: string;
  };
  dietary: {
    dietType?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
    allergies: string[];
    alcohol: {
      allowed: boolean;
      types?: string[];
    };
  };
  ethics: {
    secondHandOk: boolean;
    crueltyFree: boolean;
    local: boolean;
    ecoLabels: string[];
  };
  budgets: BudgetRange[];
  currentWants: CurrentWant[];
}

export interface Tag {
  text: string;
  weight?: number;
}

export interface BudgetRange {
  min: number;
  max: number;
  currency: 'EUR' | 'USD';
  label: string;
}

export interface CurrentWant {
  id: string;
  title: string;
  note?: string;
  priority: 'low' | 'medium' | 'high';
  deadline?: Date;
  category?: string;
  url?: string;
  priceEstimated?: number;
}

export type EventType = 
  | 'birthday' 
  | 'dinner' 
  | 'party' 
  | 'housewarming' 
  | 'christmas' 
  | 'valentine' 
  | 'wedding' 
  | 'birth' 
  | 'farewell' 
  | 'mothersday' 
  | 'fathersday' 
  | 'backtoschool' 
  | 'thanks' 
  | 'recovery' 
  | 'travel';

export interface AccessRequest {
  id: string;
  requesterId?: string;
  requesterEmail?: string;
  requesterName?: string;
  ownerId: string;
  eventType: EventType;
  eventDate?: Date;
  note?: string;
  requestedAt: Date;
  status: 'pending' | 'accepted' | 'refused' | 'expired';
  accessScope: {
    sections: ProfileSection[];
    durationDays: number;
  };
  respondedAt?: Date;
  expiresAt?: Date;
}

export interface ShareLink {
  token: string;
  ownerId: string;
  createdAt: Date;
  defaultEventType?: EventType;
  previewConfig: {
    showBudgets: boolean;
    showSafeBets: boolean;
    maxItems: number;
  };
}

export interface Idea {
  id: string;
  ownerId: string;
  eventType?: EventType;
  title: string;
  description?: string;
  url?: string;
  priceEstimated?: number;
  category?: string;
  status: 'approved' | 'pending';
  createdBy: 'owner' | string; // 'owner' or guestId
  tags: string[];
  isSafeBet?: boolean;
  createdAt: Date;
}

export interface Reservation {
  id: string;
  ideaId: string;
  reserverId: string;
  reserverName?: string;
  reservedAt: Date;
  status: 'active' | 'cancelled';
  note?: string;
}

export interface GiftReceived {
  id: string;
  ownerId: string;
  title: string;
  category?: string;
  brand?: string;
  condition: 'new' | 'likeNew' | 'good' | 'used';
  photos: string[];
  estimatedValue?: number;
  sourceEventId?: string;
  giverId?: string;
  note?: string;
  createdAt: Date;
}

export interface RegiftListing {
  id: string;
  giftId: string;
  visibilityScope: {
    audience: 'friends' | 'previousViewers' | 'event' | 'custom';
    eventType?: EventType;
    exclusions: string[];
  };
  logistics: {
    mode: 'handOver' | 'relay' | 'shipping';
    note?: string;
  };
  status: 'active' | 'reserved' | 'expired';
  startsAt: Date;
  endsAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'access_request' | 'access_granted' | 'access_refused' | 'idea_proposed' | 'idea_reserved' | 'regift_request';
  title: string;
  message: string;
  payload: Record<string, any>;
  readAt?: Date;
  createdAt: Date;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  birthday: 'Anniversaire',
  dinner: 'Dîner/Invitation', 
  party: 'Soirée',
  housewarming: 'Pendaison de crémaillère',
  christmas: 'Noël/Secret Santa',
  valentine: 'Saint-Valentin',
  wedding: 'Mariage',
  birth: 'Naissance/Baby shower',
  farewell: 'Pot de départ',
  mothersday: 'Fête des mères',
  fathersday: 'Fête des pères',
  backtoschool: 'Rentrée',
  thanks: 'Remerciements',
  recovery: 'Convalescence',
  travel: 'Voyage'
};

export const BUDGET_RANGES: BudgetRange[] = [
  { min: 0, max: 15, currency: 'EUR', label: 'Moins de 15€' },
  { min: 15, max: 30, currency: 'EUR', label: '15-30€' },
  { min: 30, max: 60, currency: 'EUR', label: '30-60€' },
  { min: 60, max: 120, currency: 'EUR', label: '60-120€' },
  { min: 120, max: 999999, currency: 'EUR', label: 'Plus de 120€' }
];