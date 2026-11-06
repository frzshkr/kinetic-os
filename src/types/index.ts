// TypeScript definitions for APEX OS

export type ActiveTab = 'fasting' | 'briskwalk' | 'health' | 'analytics' | 'assistant' | 'settings';

export type TimeframeFilter = 'day' | 'month' | 'year';

export interface DailyHealthHabits {
  morningSun: boolean;
  electrolytes: boolean;
  stepsTarget: boolean;
  preBedBuffer: boolean;
  coldShower?: boolean;
}

export interface DailyHealthLog {
  date: string; // YYYY-MM-DD
  sleepHours: number;
  sleepQuality: number; // 0 - 100%
  readinessScore: number; // 0 - 100%
  weightKg: number;
  waterMl: number;
  proteinGrams: number;
  proteinTargetGrams: number;
  carbsGrams: number;
  fatGrams: number;
  habits: DailyHealthHabits;
}

export interface SummaryChartPoint {
  label: string;
  sublabel?: string;
  distanceKm: number;
  fastHours: number;
  calories: number;
}

export interface MetricSummary {
  timeframe: TimeframeFilter;
  label: string;
  totalDistanceMeters: number;
  totalWalkDurationSeconds: number;
  avgPaceSecondsPerKm: number;
  totalCalories: number;
  totalSteps: number;
  totalFastHours: number;
  avgFastHours: number;
  completedFastsCount: number;
  totalWaterMl: number;
  consistencyRatePercent: number;
  chartData: SummaryChartPoint[];
}

// Fasting Types
export type FastingProtocolId = '16-8' | '14-10' | '18-6' | '20-4' | '24-0' | 'custom';

export interface FastingProtocol {
  id: FastingProtocolId;
  name: string;
  fastHours: number;
  eatHours: number;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface FastingStage {
  name: string;
  startHour: number;
  endHour: number;
  description: string;
  scientificBenefit: string;
  color: string;
  icon: string;
}

export interface FastingRecord {
  id: string;
  startTime: number;
  endTime?: number;
  targetDurationHours: number;
  protocolId: FastingProtocolId;
  completed: boolean;
  notes?: string;
  waterIntakeMl: number;
  mood?: 'great' | 'good' | 'neutral' | 'struggling';
}

export interface FastingState {
  isActive: boolean;
  currentFast: FastingRecord | null;
  selectedProtocol: FastingProtocolId;
  customHours: number;
  waterIntakeTodayMl: number;
  waterGoalMl: number;
  history: FastingRecord[];
}

// Briskwalk Types
export interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null; // m/s
  timestamp: number;
}

export interface SplitRecord {
  kilometer: number;
  durationSeconds: number;
  paceSecondsPerKm: number;
}

export type ActivityType = 'running' | 'fast_walk' | 'brisk_walk' | 'jogging' | 'casual_walk';

export type WorkoutGoalType = 'open' | 'distance' | 'time';

export interface WorkoutGoal {
  type: WorkoutGoalType;
  targetDistanceKm?: number;
  targetDurationMinutes?: number;
}

export interface BriskwalkSession {
  id: string;
  activityType?: ActivityType;
  targetGoal?: WorkoutGoal;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  distanceMeters: number;
  avgPaceSecondsPerKm: number;
  currentPaceSecondsPerKm: number;
  currentSpeedKmh: number;
  maxSpeedKmh: number;
  caloriesBurned: number;
  estimatedSteps: number;
  path: GeoPoint[];
  splits: SplitRecord[];
  isPaused: boolean;
}

// Navigation Types
export interface SearchLocation {
  place_id: number | string;
  display_name: string;
  name: string;
  lat: number;
  lon: number;
  type?: string;
}

export interface RouteManeuver {
  type: string;
  modifier?: string;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  location: [number, number]; // [lat, lng]
}

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][]; // [lat, lng]
  maneuvers: RouteManeuver[];
  summary: string;
}

export interface HazardReport {
  id: string;
  type: 'police' | 'camera' | 'traffic' | 'hazard' | 'accident';
  label: string;
  lat: number;
  lng: number;
  timestamp: number;
  confirmations: number;
}

// AI Assistant Types
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  suggestions?: string[];
  meta?: {
    actionType?: 'start_fast' | 'start_walk' | 'set_route';
    actionPayload?: any;
  };
}

// User Profile & Settings
export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  weightKg?: number;
  heightCm?: number;
  targetPaceMinPerKm?: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
  error?: string;
}

export interface UserSettings {
  userName: string;
  weightKg: number;
  heightCm: number;
  targetPaceMinPerKm: number; // e.g. 7.5 min/km for brisk walk
  preferredFastingProtocol: FastingProtocolId;
  geminiApiKey: string;
  soundEnabled: boolean;
  voiceGuidanceEnabled: boolean;
  voiceLanguage: 'ms-MY' | 'en-US';
  darkTheme: 'obsidian' | 'cyberpunk' | 'stealth';
  unit: 'metric' | 'imperial';
}
