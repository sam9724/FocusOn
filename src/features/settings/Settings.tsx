import { useState, type ChangeEvent, type FormEvent } from "react";
import { useFocus } from "../../store/useFocus";
import {
  initialData,
  type Data,
  type Settings as Preferences,
} from "../../lib/model";
import { Dialog } from "../../components/Dialog";

import { permission } from "../notifications/notifications";
import { downloadBackup, importData, maxBackupBytes } from "./backup";
import { freshTimer, minute } from "../timer/engine";
export function Settings() {
  const s = useFocus();
  const settings = s.data.settings;
  const [message, setMessage] = useState("");
  const [incoming, setIncoming] = useState<Data | null>(null);
  const [reset, setReset] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [removing, setRemoving] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  function preference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) {
    s.settings({ ...settings, [key]: value });
    if (
      key === "focusMinutes" &&
      s.data.timer.status === "idle" &&
      s.data.timer.phase === "focus"
    )
      s.setTimer(
        freshTimer(Number(value) * minute, "focus", s.data.selectedId),
      );
  }
  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > maxBackupBytes)
        throw new Error("Choose a backup smaller than 5 MB.");
      setIncoming(importData(await file.text()));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not read that backup.",
      );
    }
  }
  async function replace(data: Data) {
    setWorking(true);
    try {
      await s.replace(data);
      setIncoming(null);
      setReset(false);
      setConfirmation("");
      setMessage("All set. Your data is saved on this device.");
    } catch {
      setMessage("Could not save changes. Your current data has been kept.");
    } finally {
      setWorking(false);
    }
  }
  function addCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    if (
      s.data.categories.some(
        (c) => c.name.toLowerCase() === newCategory.trim().toLowerCase(),
      )
    ) {
      setMessage("That category already exists.");
      return;
    }
    s.commit((d) => ({
      ...d,
      categories: [
        ...d.categories,
        { id: crypto.randomUUID(), name: newCategory.trim() },
      ],
    }));
    setNewCategory("");
  }
  return (
    <section>
      <div className="eyebrow">YOUR QUIET SPACE, YOUR WAY</div>
      <h1>Make yourself at home</h1>
      <p className="subtitle">Small adjustments. A gentler rhythm.</p>
      <p role="status">{message}</p>
      <section className="settings-card stack" aria-labelledby="rhythm">
        <h2 id="rhythm">Your rhythm</h2>
        <div className="row">
          <label>
            Focus length (minutes)
            <input
              type="number"
              min="1"
              max="180"
              value={settings.focusMinutes}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isInteger(n) && n >= 1 && n <= 180)
                  preference("focusMinutes", n);
              }}
            />
          </label>
          <label>
            Break length (0 = off)
            <input
              type="number"
              min="0"
              max="60"
              value={settings.breakMinutes}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isInteger(n) && n >= 0 && n <= 60)
                  preference("breakMinutes", n);
              }}
            />
          </label>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={(e) => preference("sound", e.target.checked)}
          />
          Gentle completion sound
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.vibration}
            onChange={(e) => preference("vibration", e.target.checked)}
          />
          Vibrate when supported
        </label>
        <p className="muted">
          A session starts your break automatically. Completing a task is always
          your choice.
        </p>
      </section>
      <section className="settings-card stack" aria-labelledby="appearance">
        <h2 id="appearance">A comfortable view</h2>
        <label>
          Theme
          <select
            value={settings.theme}
            onChange={(e) =>
              preference("theme", e.target.value as Preferences["theme"])
            }
          >
            <option value="system">Follow device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => preference("reduceMotion", e.target.checked)}
          />
          Reduce motion
        </label>
        <p className="muted">
          Your device’s reduced-motion preference is always respected.
        </p>
      </section>
      <section className="settings-card stack" aria-labelledby="notifications">
        <h2 id="notifications">A gentle heads-up</h2>
        <p>
          Allow a notification when your timer finishes. Task names stay out of
          notifications.
        </p>
        <p className="muted">
          Background alerts depend on your browser and device. Keep this app
          open if a timely alert matters. You can always use your device’s alarm
          as a backup.
        </p>
        <button
          onClick={() => {
            if (settings.notifications) {
              preference("notifications", false);
              setMessage("Notifications turned off.");
            } else {
              void permission()
                .then((granted) => {
                  preference("notifications", granted);
                  setMessage(
                    granted
                      ? "Notifications enabled."
                      : "Permission was not granted. You can change it in your device or browser settings.",
                  );
                })
                .catch(() =>
                  setMessage("Notifications are not available here."),
                );
            }
          }}
        >
          {settings.notifications
            ? "Turn notifications off"
            : "Enable notifications"}
        </button>
      </section>
      <section className="settings-card stack" aria-labelledby="categories">
        <h2 id="categories">Your categories</h2>
        <ul className="category-list">
          {s.data.categories.map((c) => (
            <li key={c.id}>
              <span>{c.name}</span>
              <div className="row">
                <button
                  aria-label={`Rename ${c.name}`}
                  onClick={() => setEditing({ ...c })}
                >
                  Rename
                </button>
                <button
                  disabled={s.data.categories.length === 1}
                  aria-label={`Delete category ${c.name}`}
                  onClick={() => setRemoving(c.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        <form className="quick-add" onSubmit={addCategory}>
          <label className="sr-only" htmlFor="category-name">
            New category name
          </label>
          <input
            id="category-name"
            maxLength={60}
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button
            disabled={!newCategory.trim() || s.data.categories.length >= 200}
          >
            Add
          </button>
        </form>
      </section>
      <section className="settings-card stack" aria-labelledby="data">
        <h2 id="data">Your data belongs to you</h2>
        <p>
          No account, ads, tracking, or cloud sync. Keep a backup somewhere you
          trust. JSON backups contain your notes in plain text.
        </p>
        <div className="row">
          <button
            onClick={() => {
              downloadBackup(s.data);
              setMessage(
                "Backup download requested. Check your Downloads or share sheet.",
              );
            }}
          >
            Export JSON
          </button>
          <label className="file-button">
            Import JSON
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => void readFile(e)}
            />
          </label>
          <button
            onClick={() =>
              void navigator.storage
                ?.persist?.()
                .then((ok) =>
                  setMessage(
                    ok
                      ? "Device storage protection requested successfully."
                      : "Your browser manages storage. Keep regular backups.",
                  ),
                )
                .catch(() =>
                  setMessage(
                    "Your browser manages storage. Keep regular backups.",
                  ),
                )
            }
          >
            Protect local storage
          </button>
        </div>
        <button onClick={() => setReset(true)}>Reset all app data…</button>
        <p className="muted">
          Backups replace the current task list after confirmation. Imported
          timers are paused and notifications stay off until you choose to
          enable them.
        </p>
      </section>

      {incoming && (
        <Dialog
          title="Restore this backup?"
          onClose={() => !working && setIncoming(null)}
        >
          <p>
            This will replace your current data with {incoming.tasks.length}{" "}
            tasks and {incoming.categories.length} categories. Export a backup
            first if you want to keep what’s here.
          </p>
          <div className="row">
            <button onClick={() => downloadBackup(s.data)}>
              Export current data
            </button>
            <button
              className="primary"
              disabled={working}
              onClick={() => void replace(incoming)}
            >
              Replace with backup
            </button>
          </div>
        </Dialog>
      )}
      {reset && (
        <Dialog
          title="A fresh start?"
          onClose={() => !working && setReset(false)}
        >
          <p>
            This removes all tasks, categories, settings and the current timer.
            Export a backup if you’d like to keep them.
          </p>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (confirmation === "RESET") void replace(initialData());
            }}
          >
            <label>
              Type RESET to confirm
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
              />
            </label>
            <button
              className="primary"
              disabled={working || confirmation !== "RESET"}
            >
              Reset all data
            </button>
          </form>
        </Dialog>
      )}
      {editing && (
        <Dialog title="Rename category" onClose={() => setEditing(null)}>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editing.name.trim()) return;
              s.commit((d) => ({
                ...d,
                categories: d.categories.map((c) =>
                  c.id === editing.id
                    ? { ...editing, name: editing.name.trim() }
                    : c,
                ),
              }));
              setEditing(null);
            }}
          >
            <label>
              Category name
              <input
                required
                maxLength={60}
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <button className="primary">Save category</button>
          </form>
        </Dialog>
      )}
      {removing && (
        <Dialog title="Remove this category?" onClose={() => setRemoving(null)}>
          <p>
            Its tasks will move to “
            {s.data.categories.find((c) => c.id !== removing)?.name}”. Your
            tasks will be kept.
          </p>
          <button
            className="primary"
            onClick={() => {
              const target = s.data.categories.find((c) => c.id !== removing);
              if (target) {
                s.commit((d) => ({
                  ...d,
                  categories: d.categories.filter((c) => c.id !== removing),
                  tasks: d.tasks.map((t) =>
                    t.categoryId === removing
                      ? { ...t, categoryId: target.id }
                      : t,
                  ),
                }));
                useFocus.setState({ deleted: null });
              }
              setRemoving(null);
            }}
          >
            Remove category and keep tasks
          </button>
        </Dialog>
      )}
    </section>
  );
}
