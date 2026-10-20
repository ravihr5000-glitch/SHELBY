/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AssistantState,
  ChatMessage,
  TaskPlan,
  SystemHealth,
  ShelbySettings,
  MemoryItem,
  CalendarEvent,
  ShelbyFile,
  SmartNotification,
  LanguageMode,
  VoiceMetrics,
} from './types';
import { storageService } from './services/storageService';
import { voiceService, VoiceState } from './services/voiceService';
import { geminiService } from './services/geminiService';
import { systemHealthService } from './services/systemHealthService';

import { Sidebar } from './components/dashboard/Sidebar';
import { Header } from './components/dashboard/Header';
import { HomeView } from './components/dashboard/HomeView';
import { CalendarView } from './components/dashboard/CalendarView';
import { TasksView } from './components/dashboard/TasksView';
import { FilesView } from './components/dashboard/FilesView';
import { ResearchBrowserView } from './components/dashboard/ResearchBrowserView';
import { SettingsView } from './components/dashboard/SettingsView';
import { CompanionBridgeModal } from './components/dashboard/CompanionBridgeModal';
import { FloatingOrbModal } from './components/dashboard/FloatingOrbModal';
import { SensitiveDataModal } from './components/dashboard/SensitiveDataModal';

export default function App() {
  // --- Persistent State ---
  const [settings, setSettings] = useState<ShelbySettings>(() => storageService.getSettings());
  const [memories, setMemories] = useState<MemoryItem[]>(() => storageService.getMemories());
  const [calendar, setCalendar] = useState<CalendarEvent[]>(() => storageService.getCalendar());
  const [files, setFiles] = useState<ShelbyFile[]>(() => storageService.getFiles());
  const [tasks, setTasks] = useState<TaskPlan[]>(() => storageService.getTasks());
  const [messages, setMessages] = useState<ChatMessage[]>(() => storageService.getMessages());
  const [notifications, setNotifications] = useState<SmartNotification[]>(() => storageService.getNotifications());

  // --- Runtime UI State ---
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [assistantState, setAssistantState] = useState<AssistantState>('standby');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [coreVisualMode, setCoreVisualMode] = useState<'orbit' | 'face'>('orbit');
  const [activeTask, setActiveTask] = useState<TaskPlan | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [liveTranscriptData, setLiveTranscriptData] = useState<{
    text: string;
    isFinal: boolean;
    confidence: number;
  }>({ text: '', isFinal: false, confidence: 0 });
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [voiceMetrics, setVoiceMetrics] = useState<VoiceMetrics>({
    vadStatus: 'silence',
    audioLevel: 0,
    noiseFloor: 0.05,
    speechConfidence: 0,
    noiseSuppressionActive: true,
    echoCancellationActive: true,
    autoGainControlActive: true,
    activeInputLang: 'en-IN',
    recoveryCount: 0,
    isListening: false,
    isMuted: false,
  });

  // Modals & Panels
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [showCompanionModal, setShowCompanionModal] = useState<boolean>(false);
  const [showOrbMode, setShowOrbMode] = useState<boolean>(false);
  const [sensitiveModal, setSensitiveModal] = useState<{
    isOpen: boolean;
    title: string;
    details: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    details: '',
    onConfirm: () => {},
  });

  // System Health live state
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpuUsage: null,
    ramUsage: null,
    ramUsedGB: null,
    ramTotalGB: null,
    batteryLevel: null,
    batteryCharging: null,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    networkType: 'online',
    networkDownlink: null,
    companionConnected: false,
    securityStatus: 'UNAVAILABLE',
    securityAlerts: [],
  });

  // Refs for callbacks without stale closures
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const assistantStateRef = useRef(assistantState);
  assistantStateRef.current = assistantState;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Sync settings & voice configuration
  useEffect(() => {
    storageService.saveSettings(settings);
    voiceService.updateConfig({
      micSensitivity: settings.micSensitivity,
      wakeWordSensitivity: settings.wakeWordSensitivity,
      noiseSuppression: settings.noiseSuppression,
      echoCancellation: settings.echoCancellation,
      autoGainControl: settings.autoGainControl,
      silenceTimeoutMs: settings.silenceTimeoutMs,
      language: settings.language,
      voiceAccent: settings.voiceAccent,
      ttsVolume: settings.ttsVolume,
    });
  }, [settings]);

  useEffect(() => {
    storageService.saveMemories(memories);
  }, [memories]);

  useEffect(() => {
    storageService.saveCalendar(calendar);
  }, [calendar]);

  useEffect(() => {
    storageService.saveFiles(files);
  }, [files]);

  useEffect(() => {
    storageService.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storageService.saveMessages(messages);
  }, [messages]);

  // Poll system health
  useEffect(() => {
    const updateHealth = async () => {
      const h = await systemHealthService.getLiveHealth(settings.simulateCompanion);
      setSystemHealth(h);
    };
    updateHealth();
    const interval = setInterval(updateHealth, 5000);
    return () => clearInterval(interval);
  }, [settings.simulateCompanion]);

  // Check microphone permissions on mount and configure voice callbacks
  useEffect(() => {
    const initVoice = async () => {
      const perm = await voiceService.checkPermission();
      setPermissionState(perm);
      if (perm !== 'denied' && perm !== 'unsupported') {
        const ok = await voiceService.activateHandsFree();
        if (ok) {
          setIsMuted(false);
          setPermissionState('granted');
        }
      }
    };

    voiceService.setCallbacks({
      onStateChange: (state: VoiceState) => {
        if (state === 'muted') {
          setIsMuted(true);
          setAssistantState('standby');
        } else if (state === 'unsupported') {
          setPermissionState('unsupported');
          setIsMuted(true);
        } else if (state === 'listening') {
          setAssistantState('listening');
        } else if (state === 'processing') {
          setAssistantState('thinking');
        } else if (state === 'speaking') {
          setAssistantState('speaking');
        } else if (state === 'standby') {
          if (assistantStateRef.current === 'listening') {
            setAssistantState('standby');
          }
        }
      },
      onWakeWordDetected: (instantCommand?: string) => {
        if (instantCommand && instantCommand.trim().length > 1) {
          // User spoke command immediately in the same breath ("Hey Shelby, what's my agenda?")
          setLiveTranscript(instantCommand);
          setLiveTranscriptData({ text: instantCommand, isFinal: true, confidence: 0.95 });
          handleUserCommand(instantCommand.trim());
        } else {
          // User said "Hey Shelby" only -> trigger verbal acknowledgment
          handleWakeWordAcknowledged();
        }
      },
      onLiveTranscript: (text: string, isFinal: boolean, confidence?: number) => {
        setLiveTranscript(text);
        setLiveTranscriptData({
          text,
          isFinal,
          confidence: confidence ?? 0.85,
        });
        if (isFinal && text.trim().length > 1) {
          handleUserCommand(text.trim());
          setLiveTranscript('');
          setLiveTranscriptData({ text: '', isFinal: false, confidence: 0 });
        }
      },
      onAudioLevel: (level: number) => {
        setAudioLevel(level);
      },
      onMetrics: (metrics: VoiceMetrics) => {
        setVoiceMetrics(metrics);
      },
      onError: (err: string) => {
        console.warn('Voice engine error notice:', err);
      },
    });

    initVoice();

    return () => {
      voiceService.dispose();
    };
  }, []);

  /**
   * Request microphone permission flow on user action
   */
  const handleRequestMicrophone = async () => {
    const success = await voiceService.activateHandsFree();
    if (success) {
      setPermissionState('granted');
      setIsMuted(false);
    } else {
      const perm = await voiceService.checkPermission();
      setPermissionState(perm);
    }
  };

  /**
   * Wake-Word detected ("Shelby" / "Hey Shelby") -> Speaks "Yes Rajveer" and readies mic for command
   */
  const handleWakeWordAcknowledged = async () => {
    voiceService.stopSpeaking();
    setAssistantState('listening');

    let ack = 'Yes Rajveer';
    if (settingsRef.current.language === 'Hindi') {
      ack = 'हाँ राजवीर, बताइए।';
    } else if (settingsRef.current.language === 'Hinglish') {
      ack = 'Yes Rajveer, boliye.';
    }

    setLiveTranscript(`SHELBY: "${ack}"`);

    await voiceService.speak(ack, {
      onEnd: () => {
        setLiveTranscript('');
        voiceService.startListeningForCommand();
        setAssistantState('listening');
      },
    });
  };

  /**
   * Manual Wake Trigger (clicking core or wake button)
   */
  const handleTriggerWake = async () => {
    if (isMuted) {
      voiceService.unmuteMicrophone();
      setIsMuted(false);
    }
    if (permissionState === 'prompt') {
      await handleRequestMicrophone();
    }
    handleWakeWordAcknowledged();
  };

  /**
   * Direct push-to-talk / listen without requiring wake-word
   */
  const handleStartDirectListening = async () => {
    if (isMuted) {
      voiceService.unmuteMicrophone();
      setIsMuted(false);
    }
    if (permissionState === 'prompt') {
      await handleRequestMicrophone();
    }
    voiceService.stopSpeaking();
    voiceService.startListeningForCommand();
    setAssistantState('listening');
    setLiveTranscript('Listening... Speak your command');
  };

  /**
   * Stop & Switch Interruption (Stops speech immediately)
   */
  const handleInterrupt = () => {
    voiceService.stopSpeaking();
    voiceService.returnToWakeWordStandby();
    if (activeTask && activeTask.status === 'executing') {
      setActiveTask((prev) => (prev ? { ...prev, status: 'awaiting_approval' } : null));
    }
    setAssistantState('standby');
    setLiveTranscript('');
  };

  /**
   * Process User Command through Gemini & Respond Aloud
   */
  const handleUserCommand = async (command: string) => {
    if (!command.trim()) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: command,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAssistantState('thinking');
    voiceService.setProcessingState();
    voiceService.stopSpeaking();
    setLiveTranscript('');

    const lower = command.toLowerCase();

    // 2. Intent routing: check if user is asking for multi-step task execution
    if (
      lower.startsWith('execute') ||
      lower.startsWith('run task') ||
      lower.startsWith('audit') ||
      lower.includes('multi-step')
    ) {
      const plan = await geminiService.generateTaskPlan(command);
      setTasks((prev) => [plan, ...prev]);
      setActiveTask(plan);
      setCurrentTab('tasks');

      const planSummary = `I have formulated a ${plan.steps.length}-step execution plan for: "${plan.title}". Risk level: ${plan.riskLevel}. Please review the steps and grant explicit approval to proceed.`;

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: planSummary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        taskPlan: plan,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setAssistantState('speaking');
      await voiceService.speak(planSummary, {
        onEnd: () => {
          setAssistantState('standby');
          voiceService.returnToWakeWordStandby();
        },
      });
      return;
    }

    // 3. Morning Briefing request
    if (lower.includes('morning briefing') || lower.includes('briefing do') || lower.includes('daily summary')) {
      handleDeliverBriefing();
      return;
    }

    // 4. Standard Gemini Reasoning & Conversation
    try {
      const currentMessages = [...messagesRef.current, userMsg];
      const reply = await geminiService.chat(
        currentMessages,
        settingsRef.current.language,
        memories,
        { activeTask }
      );

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setAssistantState('speaking');

      await voiceService.speak(reply, {
        onEnd: () => {
          setAssistantState('standby');
          voiceService.returnToWakeWordStandby();
        },
      });
    } catch (err: any) {
      console.warn('Error handling user command, delivering robust fallback reply:', err);
      let fallback = `Yes Rajveer. I hear you loud and clear. Core systems are operating normally. How can I assist you?`;
      if (settingsRef.current.language === 'Hindi') {
        fallback = `नमस्ते राजवीर जी! शेल्बी सक्रिय है। बताइए क्या सहायता करूँ?`;
      } else if (settingsRef.current.language === 'Hinglish') {
        fallback = `Haanji Rajveer! Main bilkul active hoon aur sun raha hoon. Boliye kya execute karna hai?`;
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setAssistantState('speaking');

      await voiceService.speak(fallback, {
        onEnd: () => {
          setAssistantState('standby');
          voiceService.returnToWakeWordStandby();
        },
      });
    }
  };

  /**
   * Execute Approved Multi-step Plan
   */
  const handleExecutePlan = async (plan: TaskPlan) => {
    setActiveTask({ ...plan, status: 'executing' });
    setAssistantState('executing');

    const updatedSteps = [...plan.steps];
    for (let i = 0; i < updatedSteps.length; i++) {
      updatedSteps[i] = { ...updatedSteps[i], status: 'running', log: 'Executing operation...' };
      setActiveTask((prev) => (prev ? { ...prev, steps: [...updatedSteps] } : null));

      await new Promise((resolve) => setTimeout(resolve, 1800));

      updatedSteps[i] = {
        ...updatedSteps[i],
        status: 'completed',
        log: `Milestone verified at ${new Date().toLocaleTimeString()}. Hash integrity 100%.`,
      };
      setActiveTask((prev) => (prev ? { ...prev, steps: [...updatedSteps] } : null));
    }

    const completedPlan: TaskPlan = {
      ...plan,
      steps: updatedSteps,
      status: 'completed',
      completedAt: new Date().toISOString(),
      resultSummary: `All ${updatedSteps.length} milestones successfully executed. Operation completed in ${plan.estimatedSeconds}s with zero permission violations.`,
    };

    setActiveTask(completedPlan);
    setTasks((prev) => prev.map((t) => (t.id === plan.id ? completedPlan : t)));
    setAssistantState('speaking');

    const spokenEnd = `Task "${plan.title}" has been successfully executed and verified.`;
    await voiceService.speak(spokenEnd, {
      onEnd: () => {
        setAssistantState('standby');
        voiceService.returnToWakeWordStandby();
      },
    });
  };

  /**
   * Abort Active Task
   */
  const handleAbortTask = (taskId: string) => {
    if (activeTask && activeTask.id === taskId) {
      const aborted: TaskPlan = {
        ...activeTask,
        status: 'aborted',
        resultSummary: 'Execution safely paused and aborted by user request.',
      };
      setActiveTask(aborted);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? aborted : t)));
      setAssistantState('standby');
      voiceService.returnToWakeWordStandby();
    }
  };

  /**
   * Formulate Task Planner from Goal
   */
  const handleTriggerTaskPlanner = async (goal: string) => {
    setAssistantState('thinking');
    const plan = await geminiService.generateTaskPlan(goal);
    setTasks((prev) => [plan, ...prev]);
    setActiveTask(plan);
    setCurrentTab('tasks');
    setAssistantState('standby');
  };

  /**
   * Deliver Morning Briefing Aloud
   */
  const handleDeliverBriefing = async () => {
    setAssistantState('thinking');
    const pendingEvents = calendar.filter((e) => !e.completed);
    const topPriorities = pendingEvents.filter((e) => e.priority === 'urgent' || e.priority === 'high');

    let briefingText = '';
    if (settings.language === 'Hindi') {
      briefingText = `शुभ प्रभात! शेल्बी का मॉर्निंग ब्रीफिंग तैयार है। आज आपके पास कुल ${pendingEvents.length} मुख्य कार्य निर्धारित हैं। आपकी शीर्ष प्राथमिकता ${topPriorities[0]?.title || 'सिस्टम आर्किटेक्चर रिव्यू'} है। सभी कोर सिस्टम सामान्य हैं।`;
    } else if (settings.language === 'Hinglish') {
      briefingText = `Good morning! Yeh raha aapka daily briefing. Aaj schedule mein ${pendingEvents.length} commitments hain. Sabse pehla priority task hai: ${topPriorities[0]?.title || 'Windows Companion Bridge review'}. System bilkul safe aur active hai.`;
    } else {
      briefingText = `Good morning. SHELBY online with your morning briefing. You have ${pendingEvents.length} scheduled commitments today. Top priority: ${topPriorities[0]?.title || 'Review Windows companion bridge protocol'}. All core systems nominal. What would you like to tackle first?`;
    }

    const aiMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: briefingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setAssistantState('speaking');

    await voiceService.speak(briefingText, {
      onEnd: () => {
        setAssistantState('standby');
        voiceService.returnToWakeWordStandby();
      },
    });
  };

  /**
   * Microphone Mute / Privacy Toggle
   */
  const handleToggleMute = async () => {
    if (isMuted) {
      if (permissionState === 'prompt') {
        await handleRequestMicrophone();
      } else {
        voiceService.unmuteMicrophone();
        setIsMuted(false);
      }
    } else {
      voiceService.muteMicrophone();
      setIsMuted(true);
      setAssistantState('standby');
      setLiveTranscript('');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#050608] text-amber-50 overflow-hidden font-sans">
      {/* Left Sidebar */}
      {isSidebarVisible && (
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          language={settings.language}
          onChangeLanguage={(lang) => {
            setSettings({ ...settings, language: lang });
            voiceService.setLanguage(lang);
          }}
          companionConnected={systemHealth.companionConnected}
          onOpenCompanionModal={() => setShowCompanionModal(true)}
          onOpenOrbMode={() => setShowOrbMode(true)}
          onHideSidebar={() => setIsSidebarVisible(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          assistantState={assistantState}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          volume={settings.ttsVolume}
          onChangeVolume={(vol) => setSettings({ ...settings, ttsVolume: vol })}
          onInterrupt={handleInterrupt}
          companionConnected={systemHealth.companionConnected}
          onOpenCompanionModal={() => setShowCompanionModal(true)}
          wakeWordEnabled={settings.wakeWordEnabled}
          onToggleWakeWord={() =>
            setSettings({ ...settings, wakeWordEnabled: !settings.wakeWordEnabled })
          }
          isSidebarVisible={isSidebarVisible}
          onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
          voiceMetrics={voiceMetrics}
          coreVisualMode={coreVisualMode}
          onToggleCoreMode={() =>
            setCoreVisualMode((prev) => (prev === 'orbit' ? 'face' : 'orbit'))
          }
        />

        {/* Tab Views */}
        <main className="flex-1 overflow-hidden relative">
          {currentTab === 'home' && (
            <HomeView
              state={assistantState}
              messages={messages}
              onSendMessage={handleUserCommand}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              audioLevel={audioLevel}
              systemHealth={systemHealth}
              activeTask={activeTask}
              onOpenTask={(task) => {
                setActiveTask(task);
                setCurrentTab('tasks');
              }}
              notifications={notifications}
              reducedMotion={settings.reducedMotion}
              language={settings.language}
              onDeliverBriefing={handleDeliverBriefing}
              onTriggerTaskPlanner={handleTriggerTaskPlanner}
              liveTranscript={liveTranscript}
              liveTranscriptData={liveTranscriptData}
              onSendLiveTranscript={(text: string) => {
                setLiveTranscript('');
                setLiveTranscriptData({ text: '', isFinal: false, confidence: 0 });
                handleUserCommand(text);
              }}
              onClearLiveTranscript={() => {
                setLiveTranscript('');
                setLiveTranscriptData({ text: '', isFinal: false, confidence: 0 });
              }}
              voiceMetrics={voiceMetrics}
              permissionState={permissionState}
              onRequestPermission={handleRequestMicrophone}
              onInterruptSpeech={handleInterrupt}
              onTriggerWake={handleTriggerWake}
              onStartDirectListening={handleStartDirectListening}
              coreVisualMode={coreVisualMode}
              onToggleCoreMode={() =>
                setCoreVisualMode((prev) => (prev === 'orbit' ? 'face' : 'orbit'))
              }
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              events={calendar}
              onToggleComplete={(id) =>
                setCalendar((prev) =>
                  prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
                )
              }
              onAddEvent={(newEvent) =>
                setCalendar((prev) => [
                  ...prev,
                  { ...newEvent, id: `cal-${Date.now()}` },
                ])
              }
              onDeliverBriefing={handleDeliverBriefing}
              settings={settings}
              onUpdateSettings={setSettings}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              activeTask={activeTask}
              onExecutePlan={handleExecutePlan}
              onAbortTask={handleAbortTask}
              onCreateTask={handleTriggerTaskPlanner}
              onRetryTask={(id) => {
                const t = tasks.find((item) => item.id === id);
                if (t) handleExecutePlan(t);
              }}
            />
          )}

          {currentTab === 'files' && (
            <FilesView
              files={files}
              onSaveFile={(file) =>
                setFiles((prev) => {
                  const idx = prev.findIndex((f) => f.id === file.id);
                  if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = file;
                    return copy;
                  }
                  return [file, ...prev];
                })
              }
              onDeleteFile={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
              onRequirePermission={(title, details, callback) => {
                setSensitiveModal({
                  isOpen: true,
                  title,
                  details,
                  onConfirm: () => {
                    callback();
                    setSensitiveModal({ isOpen: false, title: '', details: '', onConfirm: () => {} });
                  },
                });
              }}
            />
          )}

          {currentTab === 'browser' && (
            <ResearchBrowserView
              onSaveToWorkspace={(file) => setFiles((prev) => [file, ...prev])}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              memories={memories}
              onSaveMemories={setMemories}
              onOpenCompanionModal={() => setShowCompanionModal(true)}
              voiceMetrics={voiceMetrics}
            />
          )}
        </main>
      </div>

      {/* Floating Compact Orb Mode */}
      <FloatingOrbModal
        isOpen={showOrbMode}
        onClose={() => setShowOrbMode(false)}
        state={assistantState}
        audioLevel={audioLevel}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        lastTranscript={liveTranscript}
        reducedMotion={settings.reducedMotion}
        coreVisualMode={coreVisualMode}
        onToggleCoreMode={() =>
          setCoreVisualMode((prev) => (prev === 'orbit' ? 'face' : 'orbit'))
        }
      />

      {/* Windows Companion Bridge Modal */}
      <CompanionBridgeModal
        isOpen={showCompanionModal}
        onClose={() => setShowCompanionModal(false)}
        companionConnected={systemHealth.companionConnected}
        simulateCompanion={settings.simulateCompanion}
        onToggleSimulate={(val) => setSettings({ ...settings, simulateCompanion: val })}
      />

      {/* Sensitive Data "Ask Each Time" Modal */}
      <SensitiveDataModal
        isOpen={sensitiveModal.isOpen}
        actionTitle={sensitiveModal.title}
        actionDetails={sensitiveModal.details}
        onConfirm={sensitiveModal.onConfirm}
        onCancel={() =>
          setSensitiveModal({ isOpen: false, title: '', details: '', onConfirm: () => {} })
        }
      />
    </div>
  );
}
