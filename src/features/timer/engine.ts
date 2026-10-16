export type Phase = "focus" | "starter" | "break";
export interface Timer {
  phase: Phase;
  status: "idle" | "running" | "paused";
  duration: number;
  remaining: number;
  endAt: number | null;
  taskId: string | null;
}
export const minute = 60_000;
export function freshTimer(
  duration = 25 * minute,
  phase: Phase = "focus",
  taskId: string | null = null,
): Timer {
  return {
    phase,
    status: "idle",
    duration,
    remaining: duration,
    endAt: null,
    taskId,
  };
}
export function remaining(t: Timer, now: number): number {
  return t.status === "running" && t.endAt !== null
    ? Math.max(0, t.endAt - now)
    : t.remaining;
}
export function start(t: Timer, now: number): Timer {
  return t.status === "running"
    ? t
    : { ...t, status: "running", endAt: now + t.remaining };
}
export function pause(t: Timer, now: number): Timer {
  return { ...t, status: "paused", remaining: remaining(t, now), endAt: null };
}
export function extend(t: Timer, now: number, amount = 5 * minute): Timer {
  return {
    ...t,
    duration: t.duration + amount,
    remaining: remaining(t, now) + amount,
    endAt: t.status === "running" ? (t.endAt ?? now) + amount : null,
  };
}
// Only one transition per reconciliation. Break starts at the original deadline,
// so waking from sleep cannot create a fresh, unexpected five-minute break.
export function reconcile(
  t: Timer,
  now: number,
  breakMinutes: number,
): { timer: Timer; completed: Phase | null } {
  if (t.status !== "running" || remaining(t, now) > 0)
    return { timer: t, completed: null };
  if (t.phase === "focus" && breakMinutes > 0) {
    const b = start(freshTimer(breakMinutes * minute, "break"), t.endAt ?? now);
    return {
      timer: remaining(b, now) > 0 ? b : freshTimer(b.duration, "break"),
      completed: "focus",
    };
  }
  return {
    timer: freshTimer(t.duration, t.phase, t.taskId),
    completed: t.phase,
  };
}
