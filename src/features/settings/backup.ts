import { dataSchema, type Data } from "../../lib/model";
import { pause } from "../timer/engine";
export const maxBackupBytes = 5 * 1024 * 1024;
export function exportData(data: Data): string {
  return JSON.stringify(dataSchema.parse(data), null, 2);
}
export function importData(text: string, now = Date.now()): Data {
  if (new TextEncoder().encode(text).byteLength > maxBackupBytes)
    throw new Error("Backup is larger than 5 MB.");
  const result = dataSchema.safeParse(JSON.parse(text) as unknown);
  if (!result.success)
    throw new Error(
      "This file is not a valid One Thing Focus version 1 backup.",
    );
  const data = result.data;
  return {
    ...data,
    settings: { ...data.settings, notifications: false },
    timer:
      data.timer.status === "running" ? pause(data.timer, now) : data.timer,
  };
}
export function downloadBackup(data: Data) {
  const blob = new Blob([exportData(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `one-thing-focus-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
