import { useState, type FormEvent } from "react";
import { useFocus } from "../../store/useFocus";
import { sizeMinutes, type Task, type Size } from "../../lib/model";
import { freshTimer, minute } from "../timer/engine";
import { candidates, pickTask } from "./taskLogic";
import { Dialog } from "../../components/Dialog";
export function Tasks({
  quickAdd,
  onQuickAdded,
  onFocus,
}: {
  quickAdd: boolean;
  onQuickAdded: () => void;
  onFocus: () => void;
}) {
  const s = useFocus();
  const [category, setCategory] = useState("");
  const [energy, setEnergy] = useState("");
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [message, setMessage] = useState("");
  const [showDone, setShowDone] = useState(false);
  const tasks = candidates(s.data.tasks, category, energy);
  const busy = s.data.timer.status !== "idle";
  function moveVisible(index: number, direction: -1 | 1) {
    const task = tasks[index];
    const neighbor = tasks[index + direction];
    if (!task || !neighbor) return;
    s.commit((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === task.id
          ? { ...t, order: neighbor.order }
          : t.id === neighbor.id
            ? { ...t, order: task.order }
            : t,
      ),
    }));
  }
  function select(task: Task) {
    if (busy) {
      setMessage("Reset the current timer before switching tasks.");
      return;
    }
    s.select(task.id);
    s.setTimer(freshTimer(sizeMinutes[task.size] * minute, "focus", task.id));
    onFocus();
  }
  function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    s.add(title, category || s.data.categories[0].id);
    setTitle("");
    onQuickAdded();
    setMessage("Task added. One small step.");
  }
  return (
    <section className="tasks-page">
      <div className="eyebrow">MAKE A LITTLE ROOM</div>
      <h1>Your things</h1>
      <p className="subtitle">Keep them here. Focus on just one.</p>
      <form className="quick-add" onSubmit={add}>
        <label className="sr-only" htmlFor="quick-title">
          New task title
        </label>
        <input
          id="quick-title"
          autoFocus={quickAdd}
          placeholder="What would you like to do?"
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="primary" disabled={!title.trim()}>
          Add task
        </button>
      </form>
      <div className="filters">
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {s.data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Your energy
          <select value={energy} onChange={(e) => setEnergy(e.target.value)}>
            <option value="">Any energy</option>
            <option value="low">Low · Tiny tasks</option>
            <option value="medium">Medium · Medium tasks</option>
            <option value="high">High · Big tasks</option>
          </select>
        </label>
        <button
          onClick={() => {
            const task = pickTask(tasks);
            if (task) select(task);
            else setMessage("No matching tasks. Try another filter.");
          }}
        >
          ✦ Pick for me
        </button>
      </div>
      <p role="status" className="muted">
        {message}
      </p>
      <ul className="task-list">
        {tasks.map((task, i) => (
          <li key={task.id}>
            <button className="task-select" onClick={() => select(task)}>
              <strong>{task.title}</strong>
              <span>
                {s.data.categories.find((c) => c.id === task.categoryId)?.name}{" "}
                · {task.size} · {sizeMinutes[task.size]}m
                {task.id === s.data.selectedId ? " · Current" : ""}
              </span>
            </button>
            <div className="row">
              <button
                aria-label={`Move ${task.title} up`}
                disabled={i === 0}
                onClick={() => moveVisible(i, -1)}
              >
                ↑
              </button>
              <button
                aria-label={`Move ${task.title} down`}
                disabled={i === tasks.length - 1}
                onClick={() => moveVisible(i, 1)}
              >
                ↓
              </button>
              <button
                onClick={() => setEditing({ ...task })}
                aria-label={`Edit ${task.title}`}
              >
                Edit
              </button>
              <button
                onClick={() => s.remove(task.id)}
                aria-label={`Delete ${task.title}`}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && (
        <div className="empty">
          <span aria-hidden="true">○</span>
          <h2>A little breathing room.</h2>
          <p>
            {s.data.tasks.some((t) => !t.done)
              ? "Try a different filter to find your next thing."
              : "Add one small task whenever you’re ready."}
          </p>
        </div>
      )}
      {s.deleted && (
        <div className="undo" role="status">
          “{s.deleted.title}” removed.{" "}
          <button onClick={s.undo}>Undo delete</button>
        </div>
      )}
      <button onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
        {showDone ? "Hide" : "Show"} completed tasks
      </button>
      {showDone && (
        <ul className="task-list">
          {s.data.tasks
            .filter((t) => t.done)
            .map((t) => (
              <li key={t.id}>
                <span>✓ {t.title}</span>
                <button
                  onClick={() =>
                    s.edit({ ...t, done: false, completedAt: null })
                  }
                >
                  Reopen
                </button>
                <button onClick={() => s.remove(t.id)}>Delete</button>
              </li>
            ))}
        </ul>
      )}
      {editing && (
        <Dialog title="Make it your own" onClose={() => setEditing(null)}>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editing.title.trim()) return;
              s.edit(editing);
              setEditing(null);
            }}
          >
            <label>
              Task title
              <input
                required
                maxLength={200}
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </label>
            <label>
              Category
              <select
                value={editing.categoryId}
                onChange={(e) =>
                  setEditing({ ...editing, categoryId: e.target.value })
                }
              >
                {s.data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Task size
              <select
                value={editing.size}
                onChange={(e) =>
                  setEditing({ ...editing, size: e.target.value as Size })
                }
              >
                <option value="tiny">Tiny · 10 min</option>
                <option value="medium">Medium · 25 min</option>
                <option value="big">Big · 45 min</option>
              </select>
            </label>
            <label>
              Notes
              <textarea
                rows={4}
                maxLength={10000}
                value={editing.notes}
                onChange={(e) =>
                  setEditing({ ...editing, notes: e.target.value })
                }
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={editing.done}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    done: e.target.checked,
                    completedAt: e.target.checked ? Date.now() : null,
                  })
                }
              />
              Done
            </label>
            <button className="primary">Save changes</button>
          </form>
        </Dialog>
      )}
    </section>
  );
}
