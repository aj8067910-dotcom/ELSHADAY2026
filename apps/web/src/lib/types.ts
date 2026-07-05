export interface LevelInfo {
  level: number;
  title: string;
  xpForNext: number;
  xpIntoLevel: number;
  progress: number;
}

export interface GamificationSummary {
  xpTotal: number;
  level: LevelInfo;
  streak: { current: number; longest: number };
  badges: Array<{ code: string; name: string; icon: string; earnedAt: string }>;
  growthTree: Array<{ area: GrowthAreaKey; xp: number }>;
}

export type GrowthAreaKey =
  | 'PALAVRA'
  | 'ORACAO'
  | 'SERVICO'
  | 'COMUNHAO'
  | 'EVANGELISMO'
  | 'ADORACAO';

export interface Me {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  favoriteVerse?: string;
  role: string;
  xpTotal: number;
  level: LevelInfo;
  team?: { id: string; name: string; color: string };
  leader?: { id: string; name: string };
  duoPartnerId?: string | null;
  duoPartner?: {
    id: string;
    name: string;
    nickname?: string;
    avatarUrl?: string;
  } | null;
}

export interface Member {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  role: string;
  teamId?: string;
}

export const LEADERSHIP_ROLES = ['ADMIN', 'PASTOR', 'LIDER', 'VICE_LIDER'];

export interface Devotional {
  id: string;
  date: string;
  theme: string;
  verse: string;
  verseRef: string;
  body: string;
  imageUrl?: string;
  question?: string;
  author: { id: string; name: string; avatarUrl?: string };
  completedByMe?: boolean;
  _count?: { completions: number };
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  icon: string;
  xpReward: number;
  area: GrowthAreaKey;
  completed: boolean;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  theme?: string;
  startsAt: string;
  endsAt: string;
  missions: Mission[];
  progress: number;
}

export interface PrayerRequest {
  id: string;
  title: string;
  body: string;
  visibility: 'PUBLICO' | 'LIDERANCA' | 'PRIVADO';
  answered: boolean;
  testimony?: string;
  live: boolean;
  createdAt: string;
  user: { id: string; name: string; nickname?: string; avatarUrl?: string };
  _count: { intercessions: number };
}

export interface ChurchEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  bannerUrl?: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  xpReward: number;
  myStatus: 'CONFIRMADO' | 'CHECKIN' | null;
  // visível apenas para a liderança (GET /events/:id)
  checkinCode?: string;
  _count: { attendances: number };
}

export interface RankingEntry {
  position: number;
  xp: number;
  level?: LevelInfo;
  user: {
    id: string;
    name: string;
    nickname?: string;
    avatarUrl?: string;
  };
}

export interface XpGrant {
  amount: number;
  xpTotal: number;
  leveledUp: boolean;
  level: number;
  levelTitle: string;
}
