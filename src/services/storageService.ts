import {
  ShelbySettings,
  MemoryItem,
  TaskPlan,
  CalendarEvent,
  ShelbyFile,
  ChatMessage,
  SmartNotification,
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'shelby_settings_v1',
  MEMORIES: 'shelby_memories_v1',
  TASKS: 'shelby_tasks_v1',
  CALENDAR: 'shelby_calendar_v1',
  FILES: 'shelby_files_v1',
  MESSAGES: 'shelby_messages_v1',
  NOTIFICATIONS: 'shelby_notifications_v1',
};

const DEFAULT_SETTINGS: ShelbySettings = {
  language: 'English',
  voiceAccent: 'Indian English',
  speechRate: 1.0,
  speechPitch: 1.0,
  ttsVolume: 0.9,
  wakeWordEnabled: true,
  wakeWordSensitivity: 'medium',
  micSensitivity: 'medium',
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  silenceTimeoutMs: 1400,
  memoryCollectionPaused: false,
  morningBriefingEnabled: true,
  morningBriefingTime: '08:30',
  reducedMotion: false,
  companionHost: '127.0.0.1',
  companionPort: 41829,
  simulateCompanion: false,
  sensitiveDataPolicy: 'ask_each_time',
};

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'preference',
    key: 'Preferred Assistant Tone',
    value: 'Calm, concise, futuristic, Indian English pronunciation for tech terms.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confidence: 0.98,
  },
  {
    id: 'mem-2',
    category: 'routine',
    key: 'Morning Routine',
    value: 'Deliver Morning Briefing at 08:30 with priorities, calendar, and system health status.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confidence: 0.95,
  },
  {
    id: 'mem-3',
    category: 'project',
    key: 'Primary Focus',
    value: 'SHELBY Windows Desktop Integration & Core System Telemetry.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confidence: 0.92,
  },
];

const INITIAL_CALENDAR: CalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'SHELBY Morning Briefing & System Check',
    time: '08:30',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: 15,
    priority: 'high',
    category: 'briefing',
    completed: true,
  },
  {
    id: 'cal-2',
    title: 'Windows Companion Bridge Architecture Review',
    time: '11:00',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: 45,
    priority: 'high',
    category: 'work',
    completed: false,
  },
  {
    id: 'cal-3',
    title: 'Verify File Sandbox & Storage Encryption Audit',
    time: '14:30',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: 30,
    priority: 'medium',
    category: 'system',
    completed: false,
  },
  {
    id: 'cal-4',
    title: 'Review Indian English Voice Cadence & Hinglish Lexicon',
    time: '17:00',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: 30,
    priority: 'low',
    category: 'work',
    completed: false,
  },
];

const INITIAL_FILES: ShelbyFile[] = [
  {
    id: 'f-1',
    name: 'system_architecture_spec.md',
    path: '/shelby-workspace/docs/system_architecture_spec.md',
    size: '14.2 KB',
    type: 'markdown',
    updatedAt: 'Today, 08:15',
    content: `# SHELBY Architecture Specification
Stage 1: AI Studio React + Three.js WebGL Core + Server-Side Gemini
Stage 2: Windows Background Companion Daemon (Port 41829)
Security: Ask-Each-Time sensitive information policy with zero plain credentials.`,
    isWorkspace: true,
  },
  {
    id: 'f-2',
    name: 'companion_ipc_protocol.json',
    path: '/shelby-workspace/configs/companion_ipc_protocol.json',
    size: '3.8 KB',
    type: 'json',
    updatedAt: 'Yesterday, 19:40',
    content: `{
  "protocol": "SHELBY_IPC_V1",
  "port": 41829,
  "endpoints": {
    "telemetry": "/v1/system/telemetry",
    "wakeWord": "/v1/audio/wakeword",
    "control": "/v1/os/control"
  }
}`,
    isWorkspace: true,
  },
  {
    id: 'f-3',
    name: 'morning_briefing_template.txt',
    path: '/shelby-workspace/templates/morning_briefing_template.txt',
    size: '1.5 KB',
    type: 'text',
    updatedAt: '2 days ago',
    content: `Good morning. All systems optimal. You have 3 priority objectives and 1 system check scheduled today.`,
    isWorkspace: true,
  },
];

export const storageService = {
  getSettings(): ShelbySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: ShelbySettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  },

  getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : INITIAL_MEMORIES;
    } catch {
      return INITIAL_MEMORIES;
    }
  },

  saveMemories(memories: MemoryItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
    } catch (e) {
      console.warn('Failed to save memories:', e);
    }
  },

  getTasks(): TaskPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveTasks(tasks: TaskPlan[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks:', e);
    }
  },

  getCalendar(): CalendarEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALENDAR);
      return data ? JSON.parse(data) : INITIAL_CALENDAR;
    } catch {
      return INITIAL_CALENDAR;
    }
  },

  saveCalendar(events: CalendarEvent[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(events));
    } catch (e) {
      console.warn('Failed to save calendar:', e);
    }
  },

  getFiles(): ShelbyFile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FILES);
      return data ? JSON.parse(data) : INITIAL_FILES;
    } catch {
      return INITIAL_FILES;
    }
  },

  saveFiles(files: ShelbyFile[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    } catch (e) {
      console.warn('Failed to save files:', e);
    }
  },

  getMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return [
      {
        id: 'msg-init-1',
        role: 'assistant',
        content:
          "SHELBY online. Core telemetry nominal. Say \"Hey Shelby\" or click the microphone to issue a command in English, Hindi, or Hinglish.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        state: 'standby',
      },
    ];
  },

  saveMessages(messages: ChatMessage[]) {
    try {
      // Keep last 50 messages
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages.slice(-50)));
    } catch (e) {
      console.warn('Failed to save messages:', e);
    }
  },

  getNotifications(): SmartNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data
        ? JSON.parse(data)
        : [
            {
              id: 'notif-1',
              title: 'SHELBY Initialized',
              message: 'Stage 1 AI Studio web engine active with genuine 3D orbital core.',
              type: 'info',
              timestamp: 'Just now',
              read: false,
              spoken: false,
            },
            {
              id: 'notif-2',
              title: 'Windows Companion Bridge Notice',
              message: 'Daemon port 41829 offline. Running in browser sandbox mode.',
              type: 'warning',
              timestamp: '1m ago',
              read: false,
              spoken: false,
            },
          ];
    } catch {
      return [];
    }
  },

  saveNotifications(notifs: SmartNotification[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    } catch (e) {
      console.warn('Failed to save notifications:', e);
    }
  },
};
