let sharedCtx: AudioContext | null = null;
let alarmIntervalId: ReturnType<typeof setInterval> | null = null;
let alarmTimeoutId: ReturnType<typeof setTimeout> | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedCtx) sharedCtx = new Ctx();
    if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
    return sharedCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  opts: { startDelay?: number; duration?: number; gain?: number; type?: OscillatorType } = {}
) {
  const ctx = getCtx();
  if (!ctx) return;
  const { startDelay = 0, duration = 0.4, gain = 0.1, type = 'sine' } = opts;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    const now = ctx.currentTime + startDelay;
    osc.frequency.setValueAtTime(freq, now);
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    /* noop */
  }
}

export function playNotificationSound(isOwnerAlert = false): void {
  try {
    if (isOwnerAlert) {
      playTone(523.25, { type: 'sine', gain: 0.08 });
      playTone(783.99, { startDelay: 0, type: 'sine', gain: 0.08 });
      playTone(659.25, { startDelay: 0.12, type: 'sine', gain: 0.08 });
      playTone(1046.5, { startDelay: 0.12, type: 'sine', gain: 0.08 });
    } else {
      playTone(587.33, { type: 'sine', gain: 0.08, duration: 0.25 });
    }
  } catch {
    /* noop */
  }
}

function playSingleChime(): void {
  try {
    const now = 0;
    playTone(880, { startDelay: now, duration: 0.9, gain: 0.25, type: 'triangle' });
    playTone(1174.66, { startDelay: now + 0.15, duration: 0.9, gain: 0.25, type: 'sine' });
    playTone(1318.51, { startDelay: now + 0.3, duration: 0.9, gain: 0.25, type: 'sine' });
  } catch {
    /* noop */
  }
}

export function startOwnerRingingAlarm(): void {
  stopOwnerRingingAlarm();
  playSingleChime();
  alarmIntervalId = setInterval(playSingleChime, 1200);
  alarmTimeoutId = setTimeout(() => stopOwnerRingingAlarm(), 60000);
}

export function stopOwnerRingingAlarm(): void {
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
  if (alarmTimeoutId) {
    clearTimeout(alarmTimeoutId);
    alarmTimeoutId = null;
  }
}

export function showNotification(title: string, body: string): void {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } catch {
    /* noop */
  }
}
