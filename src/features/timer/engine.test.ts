import { describe, it, expect } from "vitest";
import {
  freshTimer,
  start,
  pause,
  remaining,
  extend,
  reconcile,
  minute,
} from "./engine";
describe("timestamp timer", () => {
  it("is accurate after backgrounding and sleeping", () => {
    const t = start(freshTimer(), 1000);
    expect(remaining(t, 601000)).toBe(15 * minute);
    expect(remaining(t, 9999999)).toBe(0);
  });
  it("pauses and resumes without counting paused time", () => {
    const t = pause(start(freshTimer(), 0), minute);
    expect(remaining(start(t, 900000), 960000)).toBe(23 * minute);
  });
  it("extends the deadline and resets without mutation", () => {
    const t = start(freshTimer(), 0);
    expect(extend(t, minute).endAt).toBe(30 * minute);
    expect(t.endAt).toBe(25 * minute);
  });
  it("starts a break at the deadline and never replays sleep time", () => {
    const t = start(freshTimer(), 0);
    const result = reconcile(t, 26 * minute, 5);
    expect(result.completed).toBe("focus");
    expect(remaining(result.timer, 26 * minute)).toBe(4 * minute);
    expect(reconcile(t, 60 * minute, 5).timer.status).toBe("idle");
    expect(reconcile(result.timer, 26 * minute, 5).completed).toBeNull();
  });
  it("does not start a break after starter mode", () => {
    expect(
      reconcile(start(freshTimer(2 * minute, "starter"), 0), 2 * minute, 5)
        .timer.phase,
    ).toBe("starter");
  });
});
