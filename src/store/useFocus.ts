import { create } from "zustand";
import { database } from "../db/database";
import {
  initialData,
  taskSchema,
  type Data,
  type Task,
  type Settings,
} from "../lib/model";
import { freshTimer, minute, type Timer } from "../features/timer/engine";
import { reorder } from "../features/tasks/taskLogic";
interface FocusState {
  data: Data;
  ready: boolean;
  replacing: boolean;
  error: string | null;
  deleted: Task | null;
  hydrate: () => Promise<void>;
  commit: (fn: (d: Data) => Data) => void;
  add: (title: string, categoryId: string) => void;
  edit: (task: Task) => void;
  remove: (id: string) => void;
  undo: () => void;
  move: (id: string, direction: -1 | 1) => void;
  select: (id: string | null) => void;
  setTimer: (timer: Timer) => void;
  settings: (settings: Settings) => void;
  replace: (data: Data) => Promise<void>;
  retry: () => Promise<void>;
}
let writes: Promise<void> = Promise.resolve();
export function flushWrites(): Promise<void> {
  return writes;
}
export const useFocus = create<FocusState>((set, get) => ({
  data: initialData(),
  ready: false,
  replacing: false,
  error: null,
  deleted: null,
  hydrate: async () => {
    try {
      set({ data: await database.load(), ready: true, error: null });
    } catch {
      set({
        error:
          "Your saved data could not be opened. Reload to try again. No data has been replaced.",
      });
    }
  },
  commit: (fn) => {
    if (get().replacing) return;
    const data = fn(get().data);
    set({ data });
    writes = writes
      .then(() => database.save(data))
      .then(() => set({ error: null }))
      .catch(() =>
        set({
          error:
            "Changes could not be saved. Export a backup now, then retry saving.",
        }),
      );
  },
  add: (title, categoryId) => {
    const d = get().data;
    const task = taskSchema.parse({
      id: crypto.randomUUID(),
      title,
      categoryId,
      size: "medium",
      notes: "",
      done: false,
      completedAt: null,
      order: Math.max(-1, ...d.tasks.map((t) => t.order)) + 1,
      createdAt: Date.now(),
    });
    get().commit((d) => ({
      ...d,
      tasks: [...d.tasks, task],
      selectedId: d.selectedId ?? task.id,
    }));
  },
  edit: (task) => {
    const valid = taskSchema.parse(task);
    get().commit((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === task.id ? valid : t)),
    }));
  },
  remove: (id) => {
    set({ deleted: get().data.tasks.find((t) => t.id === id) ?? null });
    get().commit((d) => ({
      ...d,
      tasks: d.tasks.filter((t) => t.id !== id),
      selectedId: d.selectedId === id ? null : d.selectedId,
      timer:
        d.timer.taskId === id
          ? freshTimer(d.settings.focusMinutes * minute)
          : d.timer,
    }));
  },
  undo: () => {
    const task = get().deleted;
    if (task) {
      get().commit((d) => ({
        ...d,
        tasks: [...d.tasks, task].sort((a, b) => a.order - b.order),
      }));
      set({ deleted: null });
    }
  },
  move: (id, direction) =>
    get().commit((d) => ({ ...d, tasks: reorder(d.tasks, id, direction) })),
  select: (id) => get().commit((d) => ({ ...d, selectedId: id })),
  setTimer: (timer) => get().commit((d) => ({ ...d, timer })),
  settings: (settings) => get().commit((d) => ({ ...d, settings })),
  replace: async (data) => {
    if (get().replacing) throw new Error("A restore is already in progress.");
    set({ replacing: true });
    const replacement = writes.then(async () => {
      await database.save(data);
      set({ data, deleted: null, error: null });
    });
    writes = replacement.catch(() => undefined);
    try {
      await replacement;
    } finally {
      set({ replacing: false });
    }
  },
  retry: async () => {
    await writes;
    try {
      await database.save(get().data);
      set({ error: null });
    } catch {
      set({ error: "Still unable to save. Please export a backup." });
    }
  },
}));
