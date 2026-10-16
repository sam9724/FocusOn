import { type Task, type Size } from "../../lib/model";
export function candidates(
  tasks: Task[],
  categoryId: string,
  energy: string,
): Task[] {
  return tasks
    .filter(
      (t) =>
        !t.done &&
        (!categoryId || t.categoryId === categoryId) &&
        (!energy ||
          t.size ===
            (
              { low: "tiny", medium: "medium", high: "big" } as Record<
                string,
                Size
              >
            )[energy]),
    )
    .sort((a, b) => a.order - b.order);
}
export function pickTask(
  tasks: Task[],
  random: () => number = Math.random,
): Task | null {
  return tasks.length
    ? tasks[
        Math.min(
          tasks.length - 1,
          Math.max(0, Math.floor(random() * tasks.length)),
        )
      ]
    : null;
}
export function reorder(tasks: Task[], id: string, direction: -1 | 1): Task[] {
  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  const from = sorted.findIndex((t) => t.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= sorted.length) return tasks;
  [sorted[from], sorted[to]] = [sorted[to], sorted[from]];
  return sorted.map((t, order) => ({ ...t, order }));
}
