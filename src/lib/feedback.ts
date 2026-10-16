import type { Settings } from "./model";
import { Capacitor } from "@capacitor/core";
let context: AudioContext | null = null;
export function unlockAudio() {
  if (!("AudioContext" in window)) return;
  context ??= new AudioContext();
  void context.resume().catch(() => undefined);
}
export function feedback(settings: Settings) {
  if (settings.vibration) {
    if (Capacitor.isNativePlatform())
      void import("@capacitor/haptics")
        .then(({ Haptics }) => Haptics.vibrate({ duration: 120 }))
        .catch(() => undefined);
    else if ("vibrate" in navigator) navigator.vibrate([70, 60, 70]);
  }
  if (!settings.sound || !context || context.state !== "running") return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  const now = context.currentTime;
  oscillator.frequency.setValueAtTime(523.25, now);
  oscillator.frequency.setValueAtTime(659.25, now + 0.15);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  oscillator.start(now);
  oscillator.stop(now + 0.65);
}
