import { z } from "zod";
const id = z.string().min(1).max(100);
export const taskSchema = z
  .object({
    id,
    title: z.string().trim().min(1).max(200),
    categoryId: id,
    size: z.enum(["tiny", "medium", "big"]),
    notes: z.string().max(10000),
    done: z.boolean(),
    completedAt: z.number().finite().nullable(),
    order: z.number().finite(),
    createdAt: z.number().finite(),
  })
  .strict();
export type Task = z.infer<typeof taskSchema>;
export type Size = Task["size"];
export const categorySchema = z
  .object({ id, name: z.string().trim().min(1).max(60) })
  .strict();
export const settingsSchema = z
  .object({
    focusMinutes: z.number().int().min(1).max(180),
    breakMinutes: z.number().int().min(0).max(60),
    sound: z.boolean(),
    vibration: z.boolean(),
    theme: z.enum(["system", "light", "dark"]),
    reduceMotion: z.boolean(),
    notifications: z.boolean(),
  })
  .strict();
export type Settings = z.infer<typeof settingsSchema>;
export const timerSchema = z
  .object({
    phase: z.enum(["focus", "starter", "break"]),
    status: z.enum(["idle", "running", "paused"]),
    duration: z.number().int().min(1).max(86400000),
    remaining: z.number().finite().min(0).max(86400000),
    endAt: z.number().finite().nullable(),
    taskId: id.nullable(),
  })
  .strict()
  .refine(
    (t) => (t.status === "running") === (t.endAt !== null),
    "Timer deadline does not match status",
  );
export const dataSchema = z
  .object({
    version: z.literal(1),
    tasks: z.array(taskSchema).max(20000),
    categories: z.array(categorySchema).min(1).max(200),
    settings: settingsSchema,
    timer: timerSchema,
    selectedId: id.nullable(),
  })
  .strict()
  .superRefine((d, ctx) => {
    const categories = new Set(d.categories.map((c) => c.id));
    const tasks = new Set(d.tasks.map((t) => t.id));
    if (
      categories.size !== d.categories.length ||
      tasks.size !== d.tasks.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate identifiers" });
    if (d.tasks.some((t) => !categories.has(t.categoryId)))
      ctx.addIssue({ code: "custom", message: "Unknown category" });
    if (
      (d.selectedId && !tasks.has(d.selectedId)) ||
      (d.timer.taskId && !tasks.has(d.timer.taskId))
    )
      ctx.addIssue({ code: "custom", message: "Unknown task" });
  });
export type Data = z.infer<typeof dataSchema>;
export const sizeMinutes: Record<Size, number> = {
  tiny: 10,
  medium: 25,
  big: 45,
};
export const defaultSettings: Settings = {
  focusMinutes: 25,
  breakMinutes: 5,
  sound: true,
  vibration: true,
  theme: "system",
  reduceMotion: false,
  notifications: false,
};
export function initialData(): Data {
  return {
    version: 1,
    tasks: [],
    categories: ["Job search", "Side business", "Projects", "Shift / Home"].map(
      (name, i) => ({ id: `category-${i}`, name }),
    ),
    settings: { ...defaultSettings },
    timer: {
      phase: "focus",
      status: "idle",
      duration: 1500000,
      remaining: 1500000,
      endAt: null,
      taskId: null,
    },
    selectedId: null,
  };
}
