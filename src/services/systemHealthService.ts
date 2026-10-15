import { SystemHealth } from '../types';

export const systemHealthService = {
  async getLiveHealth(simulateCompanion: boolean = false): Promise<SystemHealth> {
    const health: SystemHealth = {
      cpuUsage: null,
      ramUsage: null,
      ramUsedGB: null,
      ramTotalGB: null,
      batteryLevel: null,
      batteryCharging: null,
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8,
      deviceMemory: typeof navigator !== 'undefined' && 'deviceMemory' in navigator ? (navigator as any).deviceMemory : 8,
      networkType: 'online',
      networkDownlink: null,
      companionConnected: false,
      securityStatus: 'UNAVAILABLE',
      securityAlerts: [],
    };

    // 1. Real Battery API
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        health.batteryLevel = Math.round(battery.level * 100);
        health.batteryCharging = battery.charging;
      } catch {
        // Battery status denied
      }
    }

    // 2. Real Performance Memory (Chromium browsers)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      try {
        const mem = (performance as any).memory;
        const used = mem.usedJSHeapSize / (1024 * 1024 * 1024);
        const total = mem.totalJSHeapSize / (1024 * 1024 * 1024);
        health.ramUsedGB = parseFloat(used.toFixed(2));
        health.ramTotalGB = parseFloat(total.toFixed(2));
        health.ramUsage = Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100);
      } catch {
        // Ignored
      }
    }

    // 3. Real Network Information API
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      try {
        const conn = (navigator as any).connection;
        health.networkType = conn.effectiveType || '4g';
        health.networkDownlink = conn.downlink || null;
      } catch {
        // Ignored
      }
    }

    // 4. Companion connection check
    if (simulateCompanion) {
      // In companion simulation / test mode:
      health.companionConnected = true;
      health.companionVersion = 'v1.4.2-preview';
      health.cpuUsage = 24; // Simulated Windows CPU readout
      health.securityStatus = 'SECURE';
      health.securityAlerts = [];
      if (!health.ramUsage) {
        health.ramUsage = 38;
        health.ramUsedGB = 6.1;
        health.ramTotalGB = 16.0;
      }
    } else {
      // Honest state: No Windows Companion connected
      health.companionConnected = false;
      health.cpuUsage = null; // Honest: browser cannot measure whole-OS CPU load
      health.securityStatus = 'UNAVAILABLE';
      health.securityAlerts = [
        'Windows Companion daemon offline on 127.0.0.1:41829. OS CPU % and deep hardware sensors require Stage 2 companion.',
      ];
    }

    return health;
  },
};
