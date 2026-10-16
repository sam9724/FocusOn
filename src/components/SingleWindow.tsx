import { useEffect, useState, type ReactNode } from "react";
// A single writer prevents stale snapshots from two installed windows overwriting each other.
export function SingleWindow({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "owned" | "blocked">(
    "loading",
  );
  useEffect(() => {
    let release: () => void = () => undefined;
    let disposed = false;
    if (!navigator.locks) {
      setState("owned");
      return;
    }
    void navigator.locks
      .request(
        "one-thing-focus-writer",
        { ifAvailable: true },
        async (lock) => {
          if (disposed) return;
          if (!lock) {
            setState("blocked");
            return;
          }
          setState("owned");
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        },
      )
      .catch(() => setState("owned"));
    return () => {
      disposed = true;
      release();
    };
  }, []);
  if (state === "owned") return children;
  return (
    <main className="ownership">
      <h1>
        {state === "blocked"
          ? "Your space is already open."
          : "Opening your quiet space…"}
      </h1>
      {state === "blocked" && (
        <>
          <p>
            To keep your changes safe, use the window that’s already open. Close
            it, then reload here to continue.
          </p>
          <button onClick={() => location.reload()}>Reload this window</button>
        </>
      )}
    </main>
  );
}
