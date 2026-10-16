import { Settings } from "./features/settings/Settings";
import { Install } from "./components/Install";
import { useTimer } from "./features/timer/useTimer";
import { useEffect, useState } from "react";
import { useFocus } from "./store/useFocus";
import { Now } from "./features/timer/Now";
import { Tasks } from "./features/tasks/Tasks";
export function App() {
  const clock = useTimer();
  const { data, ready, error, hydrate, retry } = useFocus();
  const [tab, setTab] = useState<"now" | "tasks" | "settings">("now");
  const [quickAdd, setQuickAdd] = useState(false);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme;
    document.documentElement.dataset.motion = data.settings.reduceMotion
      ? "reduce"
      : "system";
  }, [data.settings.theme, data.settings.reduceMotion]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        e.key.toLowerCase() !== "n" ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        el.closest('input,textarea,select,[contenteditable="true"]') ||
        document.querySelector("dialog[open]")
      )
        return;
      e.preventDefault();
      setTab("tasks");
      setQuickAdd(true);
      requestAnimationFrame(() =>
        document.getElementById("quick-title")?.focus(),
      );
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const today = new Date().toDateString();
  const done = data.tasks.filter(
    (t) =>
      t.done &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === today,
  ).length;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="app-shell">
        <header className="app-header">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setTab("now");
            }}
          >
            <span className="brand-icon" aria-hidden="true">
              ◉
            </span>
            <span>
              one thing<span className="brand-small">FOCUS</span>
            </span>
          </a>
          <span className="today">✓ {done} done today</span>
        </header>
        <nav aria-label="Main navigation">
          {(["now", "tasks", "settings"] as const).map((t) => (
            <button
              key={t}
              aria-current={tab === t ? "page" : undefined}
              onClick={() => setTab(t)}
            >
              <span aria-hidden="true">
                {t === "now" ? "◉" : t === "tasks" ? "☷" : "⚙"}
              </span>
              {t === "now" ? "Now" : t === "tasks" ? "Your tasks" : "Settings"}
            </button>
          ))}
        </nav>
        <main id="main">
          {error && (
            <div role="alert" className="error">
              {error}
              <button onClick={() => void (ready ? retry() : hydrate())}>
                Try again
              </button>
            </div>
          )}
          {!ready ? (
            <p role="status">Opening your quiet space…</p>
          ) : tab === "now" ? (
            <Now clock={clock} openTasks={() => setTab("tasks")} />
          ) : tab === "tasks" ? (
            <Tasks
              quickAdd={quickAdd}
              onQuickAdded={() => setQuickAdd(false)}
              onFocus={() => setTab("now")}
            />
          ) : (
            <Settings />
          )}
        </main>
        <Install />
        <footer>
          One thing at a time is enough.
          <span>Private. On your device. Always.</span>
        </footer>
      </div>
    </>
  );
}
