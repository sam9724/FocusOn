import { it, expect } from "vitest";
import { initialData } from "../../lib/model";
import { exportData, importData } from "./backup";
import { start } from "../timer/engine";
it("round-trips tasks, categories, preferences and notes", () => {
  const data = initialData();
  data.tasks = [
    {
      id: "task-1",
      title: "One thing",
      categoryId: "category-0",
      size: "tiny",
      notes: "Personal notes",
      done: false,
      completedAt: null,
      order: 0,
      createdAt: 1,
    },
  ];
  expect(importData(exportData(data))).toEqual(data);
});
it("pauses a restored running timer and disables permissions", () => {
  const data = initialData();
  data.timer = start(data.timer, 0);
  data.settings.notifications = true;
  const restored = importData(exportData(data), 10000);
  expect(restored.timer.status).toBe("paused");
  expect(restored.timer.remaining).toBe(1490000);
  expect(restored.settings.notifications).toBe(false);
});
it("rejects malformed, future-version, duplicate and dangling data", () => {
  expect(() => importData("{")).toThrow();
  expect(() =>
    importData(JSON.stringify({ ...initialData(), version: 99 })),
  ).toThrow();
  const data = initialData();
  data.categories.push({ ...data.categories[0] });
  expect(() => importData(JSON.stringify(data))).toThrow();
  expect(() =>
    importData(JSON.stringify({ ...initialData(), selectedId: "missing" })),
  ).toThrow();
});
it("rejects oversized backups without changing persistent data", () => {
  expect(() => importData(" ".repeat(5 * 1024 * 1024 + 1))).toThrow(/5 MB/);
});
