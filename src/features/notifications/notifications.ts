import { Capacitor } from "@capacitor/core";
import type { Timer } from "../timer/engine";
import type { Settings } from "../../lib/model";
const ids = [7101, 7102];
export async function permission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const { LocalNotifications } =
      await import("@capacitor/local-notifications");
    return (
      (await LocalNotifications.requestPermissions()).display === "granted"
    );
  }
  return (
    "Notification" in window &&
    (await Notification.requestPermission()) === "granted"
  );
}
let queue: Promise<void> = Promise.resolve();
// Serialize cancellation and scheduling so rapid pause/resume cannot leave stale alarms.
export function syncNotifications(
  timer: Timer,
  settings: Settings,
): Promise<void> {
  queue = queue
    .catch(() => undefined)
    .then(async () => {
      if (!Capacitor.isNativePlatform()) return;
      const { LocalNotifications } =
        await import("@capacitor/local-notifications");
      await LocalNotifications.cancel({
        notifications: ids.map((id) => ({ id })),
      });
      if (
        !settings.notifications ||
        timer.status !== "running" ||
        !timer.endAt ||
        timer.endAt <= Date.now()
      )
        return;
      if ((await LocalNotifications.checkPermissions()).display !== "granted")
        return;
      const channelId = `focus-${settings.sound ? "sound" : "quiet"}-${settings.vibration ? "vibrate" : "still"}`;
      if (Capacitor.getPlatform() === "android") {
        await LocalNotifications.createChannel({
          id: channelId,
          name: settings.sound ? "Focus reminders" : "Quiet focus reminders",
          importance: 3,
          sound: settings.sound ? "gentle.wav" : "silent.wav",
          vibration: settings.vibration,
        });
      }
      const notifications = [
        {
          id: ids[0],
          title: "One Thing Focus",
          body:
            timer.phase === "break"
              ? "Your break is complete. Come back gently."
              : "A little progress, made. Take a breath.",
          schedule: { at: new Date(timer.endAt), allowWhileIdle: true },
          sound: settings.sound ? "gentle.wav" : undefined,
          channelId,
          silent: true,
        },
      ];
      if (timer.phase === "focus" && settings.breakMinutes > 0)
        notifications.push({
          id: ids[1],
          title: "One Thing Focus",
          body: "Your break is complete. Come back gently.",
          schedule: {
            at: new Date(timer.endAt + settings.breakMinutes * 60000),
            allowWhileIdle: true,
          },
          sound: settings.sound ? "gentle.wav" : undefined,
          channelId,
          silent: true,
        });
      await LocalNotifications.schedule({ notifications });
    });
  return queue;
}
export async function notifyCompletion(
  message: string,
  settings: Settings,
): Promise<void> {
  if (
    !settings.notifications ||
    Capacitor.isNativePlatform() ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  )
    return;
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg)
    await reg.showNotification("One Thing Focus", {
      body: message,
      tag: "focus-complete",
      silent: !settings.sound,
    });
  else
    new Notification("One Thing Focus", {
      body: message,
      silent: !settings.sound,
    });
}
