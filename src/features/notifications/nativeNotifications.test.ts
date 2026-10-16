import { it, expect, vi } from "vitest";
import { defaultSettings } from "../../lib/model";
import { freshTimer, start, pause, minute } from "../timer/engine";
const plugin = vi.hoisted(() => ({
  cancel: vi.fn().mockResolvedValue(undefined),
  checkPermissions: vi.fn().mockResolvedValue({ display: "granted" }),
  createChannel: vi.fn().mockResolvedValue(undefined),
  schedule: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => "android" },
}));
vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: plugin,
}));
import { syncNotifications } from "./notifications";
it("schedules focus and break once, cancels on pause, and respects silent/vibration preferences", async () => {
  const t = start(freshTimer(), Date.now());
  const settings = {
    ...defaultSettings,
    notifications: true,
    sound: false,
    vibration: false,
  };
  await syncNotifications(t, settings);
  expect(plugin.createChannel).toHaveBeenCalledWith(
    expect.objectContaining({ sound: "silent.wav", vibration: false }),
  );
  expect(plugin.schedule).toHaveBeenCalledWith({
    notifications: [
      expect.objectContaining({
        id: 7101,
        schedule: { at: new Date(t.endAt!), allowWhileIdle: true },
      }),
      expect.objectContaining({
        id: 7102,
        schedule: { at: new Date(t.endAt! + 5 * minute), allowWhileIdle: true },
      }),
    ],
  });
  plugin.schedule.mockClear();
  await syncNotifications(pause(t, Date.now()), settings);
  expect(plugin.cancel).toHaveBeenCalledWith({
    notifications: [{ id: 7101 }, { id: 7102 }],
  });
  expect(plugin.schedule).not.toHaveBeenCalled();
});
