import { beforeEach, describe, it, expect } from "vitest";
import { useFocus, flushWrites } from "../../store/useFocus";
import { initialData } from "../../lib/model";
import { candidates, pickTask } from "./taskLogic";
import { database, FocusDatabase } from "../../db/database";
describe("tasks and persistence", () => {
  beforeEach(async () => {
    await flushWrites();
    await database.snapshots.clear();
    useFocus.setState({ data: initialData(), deleted: null });
  });
  it("creates, edits, reorders, deletes and restores tasks", async () => {
    const s = useFocus.getState();
    s.add("First", "category-0");
    s.add("Second", "category-1");
    let tasks = useFocus.getState().data.tasks;
    s.edit({ ...tasks[0], title: "Updated", size: "tiny" });
    s.move(tasks[1].id, -1);
    expect(useFocus.getState().data.tasks[0].title).toBe("Second");
    s.remove(tasks[0].id);
    expect(useFocus.getState().data.tasks).toHaveLength(1);
    s.undo();
    tasks = useFocus.getState().data.tasks;
    expect(tasks).toHaveLength(2);
    expect(tasks.find((t) => t.title === "Updated")?.size).toBe("tiny");
    await flushWrites();
  });
  it("filters pick-for-me by category, energy and done status", () => {
    const s = useFocus.getState();
    s.add("Tiny", "category-0");
    s.add("Other", "category-1");
    s.edit({ ...useFocus.getState().data.tasks[0], size: "tiny" });
    const matches = candidates(
      useFocus.getState().data.tasks,
      "category-0",
      "low",
    );
    expect(pickTask(matches, () => 0)?.title).toBe("Tiny");
    expect(pickTask([])).toBeNull();
    s.edit({ ...matches[0], done: true, completedAt: Date.now() });
    expect(
      candidates(useFocus.getState().data.tasks, "category-0", "low"),
    ).toHaveLength(0);
  });
  it("loads data from a new IndexedDB connection", async () => {
    useFocus.getState().add("Persist me", "category-0");
    await flushWrites();
    const reopened = new FocusDatabase();
    expect((await reopened.load()).tasks[0].title).toBe("Persist me");
    reopened.close();
  });
  it("rejects empty titles", () => {
    expect(() => useFocus.getState().add("  ", "category-0")).toThrow();
  });
});
