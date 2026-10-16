import { useEffect } from "react";
import { useFocus } from "../../store/useFocus";
import { freshTimer, start, pause, extend, remaining, minute } from "./engine";
import { useTimer } from "./useTimer";
export function Now({
  openTasks,
  clock,
}: {
  openTasks: () => void;
  clock: ReturnType<typeof useTimer>;
}) {
  const { data, setTimer, edit } = useFocus();
  const { now, message, setMessage } = clock;
  const timer = data.timer;
  const task = data.tasks.find(
    (t) => t.id === (timer.taskId ?? data.selectedId),
  );
  const left = remaining(timer, now);
  const seconds = Math.ceil(left / 1000);
  const text = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  const busy = timer.status !== "idle";
  function toggle() {
    if (timer.status === "running") setTimer(pause(timer, Date.now()));
    else
      setTimer(
        start(
          {
            ...timer,
            taskId: timer.phase === "break" ? null : (task?.id ?? null),
          },
          Date.now(),
        ),
      );
  }
  function choose(minutes: number, starter = false) {
    setTimer(
      freshTimer(
        minutes * minute,
        starter ? "starter" : "focus",
        task?.id ?? null,
      ),
    );
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.code !== "Space" ||
        e.repeat ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        document.querySelector("dialog[open]")
      )
        return;
      const el = e.target as HTMLElement;
      if (el.closest('input,textarea,select,button,a,[contenteditable="true"]'))
        return;
      e.preventDefault();
      const s = useFocus.getState();
      s.setTimer(
        s.data.timer.status === "running"
          ? pause(s.data.timer, Date.now())
          : start(
              {
                ...s.data.timer,
                taskId:
                  s.data.timer.phase === "break" ? null : s.data.selectedId,
              },
              Date.now(),
            ),
      );
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <section className="now">
      <div className="eyebrow">
        {timer.phase === "break"
          ? "ROOM TO RECHARGE"
          : "ONE TASK. A LITTLE MOMENTUM."}
      </div>
      <h1>
        {timer.phase === "break"
          ? "Rest is part of the work."
          : (task?.title ?? "What’s your one thing?")}
      </h1>
      <p className="subtitle">
        {timer.phase === "break"
          ? "Stretch, sip some water, look away."
          : task
            ? `${data.categories.find((c) => c.id === task.categoryId)?.name} · ${task.size === "tiny" ? "Tiny" : task.size === "big" ? "Big" : "Medium"} task`
            : "Choose a task, or start with a little quiet focus."}
      </p>
      <div
        className="timer-ring"
        style={
          {
            "--progress": `${Math.min(100, (left / timer.duration) * 100)}%`,
          } as React.CSSProperties
        }
      >
        <div>
          <span
            className="timer-time"
            role="timer"
            aria-label={`${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds remaining`}
          >
            {text}
          </span>
          <span className="timer-label">
            {timer.phase === "starter"
              ? "just two minutes"
              : timer.phase === "break"
                ? "a short break"
                : timer.status === "paused"
                  ? "paused · take your time"
                  : "time for one thing"}
          </span>
        </div>
      </div>
      <div className="timer-controls">
        <button className="primary big" onClick={toggle}>
          {timer.status === "running"
            ? "Pause"
            : timer.status === "paused"
              ? "Resume"
              : timer.phase === "break"
                ? "Start break"
                : "Start focusing"}{" "}
          <span aria-hidden="true">
            {timer.status === "running" ? "Ⅱ" : "→"}
          </span>
        </button>
        <div className="row center">
          <button
            onClick={() =>
              setTimer(freshTimer(timer.duration, timer.phase, timer.taskId))
            }
          >
            Reset
          </button>
          <button
            disabled={timer.duration >= 180 * minute}
            onClick={() =>
              setTimer(
                extend(
                  timer,
                  Date.now(),
                  Math.min(5 * minute, 180 * minute - timer.duration),
                ),
              )
            }
          >
            +5 min
          </button>
        </div>
      </div>
      {timer.phase !== "break" && (
        <>
          <fieldset className="presets" disabled={busy}>
            <legend className="sr-only">Session length</legend>
            {[10, 15, 25, 45].map((n) => (
              <button
                key={n}
                aria-pressed={
                  timer.phase === "focus" && timer.duration === n * minute
                }
                onClick={() => choose(n)}
              >
                {n} min
              </button>
            ))}
            <label className="custom-length">
              Custom
              <input
                aria-label="Custom session minutes"
                type="number"
                min="1"
                max="180"
                value={Math.round(timer.duration / minute)}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= 1 && n <= 180) choose(n);
                }}
              />
            </label>
          </fieldset>
          <button
            className="starter"
            disabled={busy && timer.phase !== "starter"}
            onClick={() => {
              setTimer(
                start(
                  freshTimer(
                    (timer.phase === "starter"
                      ? data.settings.focusMinutes
                      : 2) * minute,
                    timer.phase === "starter" ? "focus" : "starter",
                    task?.id ?? null,
                  ),
                  Date.now(),
                ),
              );
            }}
          >
            {timer.phase === "starter"
              ? "Continue into a full session"
              : "✦ Just 2 minutes"}
          </button>
        </>
      )}
      <button
        hidden={timer.phase !== "break"}
        onClick={() =>
          setTimer(
            freshTimer(
              data.settings.focusMinutes * minute,
              "focus",
              data.selectedId,
            ),
          )
        }
      >
        Back to focus
      </button>
      <p className="encouragement" role="status">
        {message}
      </p>
      <div className="task-actions">
        {task && !task.done && (
          <button
            onClick={() => {
              edit({ ...task, done: true, completedAt: Date.now() });
              setTimer(freshTimer(data.settings.focusMinutes * minute));
              setMessage("One thing, done. You can feel good about that.");
            }}
          >
            ✓ Mark task done
          </button>
        )}
        <button onClick={openTasks}>Choose a task</button>
      </div>
      {task?.notes && timer.phase !== "break" && (
        <details className="notes">
          <summary>Task notes</summary>
          <p>{task.notes}</p>
        </details>
      )}
    </section>
  );
}
