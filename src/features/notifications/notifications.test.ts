import { it, expect, vi, afterEach } from "vitest";
import {
  permission,
  notifyCompletion,
  syncNotifications,
} from "./notifications";
import { freshTimer } from "../timer/engine";
import { defaultSettings } from "../../lib/model";
afterEach(() => vi.unstubAllGlobals());
it("handles browsers without Notifications", async () => {
  expect(await permission()).toBe(false);
  await expect(
    notifyCompletion("Done", defaultSettings),
  ).resolves.toBeUndefined();
});
it("only asks permission when explicitly called", async () => {
  const requestPermission = vi.fn().mockResolvedValue("denied");
  vi.stubGlobal("Notification", { requestPermission, permission: "default" });
  await syncNotifications(freshTimer(), defaultSettings);
  expect(requestPermission).not.toHaveBeenCalled();
  expect(await permission()).toBe(false);
  expect(requestPermission).toHaveBeenCalledOnce();
});
