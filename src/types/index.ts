export type AssistantState =
  | 'standby'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'executing'
  | 'error';

export type LanguageMode = 'English' | 'Hindi' | 'Hinglish';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  state?: AssistantState;
  taskPlan?: TaskPlan;
  interrupted?: boolean;
}

export interface TaskStep {
  id: string;
  title: string;
  actionType: 'system_check' | 'data_fetch' | 'file_operation' | 'computation' | 'verification';
  description: string;
  consequential: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  log?: string;
}

export interface TaskPlan {
  id: string;
  title: string;
  goal: string;
  estimatedSeconds: number;
  requiresApproval: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskExplanation: string;
  steps: TaskStep[];
  status: 'planning' | 'awaiting_approval' | 'executing' | 'completed' | 'failed' | 'aborted';
  createdAt: string;
  completedAt?: string;
  resultSummary?: string;
}

export interface SystemHealth {
  cpuUsage: number | null; // null if OS companion disconnected
  ramUsage: number | null; // percentage or null
  ramUsedGB?: number | null;
  ramTotalGB?: number | null;
  batteryLevel: number | null;
  batteryCharging: boolean | null;
  hardwareConcurrency: number;
  deviceMemory: number | null; // navigator.deviceMemory
  networkType: string;
  networkDownlink: number | null;
  companionConnected: boolean;
  companionVersion?: string;
  securityStatus: 'SECURE' | 'ATTENTION' | 'UNAVAILABLE';
  securityAlerts: string[];
}

export interface MemoryItem {
  id: string;
  category: 'preference' | 'project' | 'routine' | 'fact';
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
  confidence: number;
}

export interface ShelbyFile {
  id: string;
  name: string;
  path: string;
  size: string;
  type: string;
  updatedAt: string;
  content: string;
  isWorkspace: boolean;
}

export interface ResearchItem {
  id: string;
  query: string;
  timestamp: string;
  category: string;
  executiveSummary: string;
  keyFindings: string[];
  sources: Array<{ title: string; domain: string; relevance: string; keyData: string }>;
  technicalDetails?: string;
  suggestedNextSteps: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  durationMinutes: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'work' | 'personal' | 'system' | 'briefing';
  completed: boolean;
}

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  timestamp: string;
  read: boolean;
  spoken: boolean;
  actionLabel?: string;
}

export interface ShelbySettings {
  language: LanguageMode;
  voiceAccent: 'Indian English' | 'Hindi Native' | 'British Neutral' | 'American Tech';
  speechRate: number;
  speechPitch: number;
  ttsVolume: number;
  wakeWordEnabled: boolean;
  wakeWordSensitivity: 'low' | 'medium' | 'high';
  memoryCollectionPaused: boolean;
  morningBriefingEnabled: boolean;
  morningBriefingTime: string;
  reducedMotion: boolean;
  companionHost: string;
  companionPort: number;
  simulateCompanion: boolean;
  sensitiveDataPolicy: 'ask_each_time' | 'deny_all';
}
