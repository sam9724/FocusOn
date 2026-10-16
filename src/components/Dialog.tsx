import { useEffect, useRef, type ReactNode } from "react";
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} aria-labelledby="dialog-title">
      <header className="section-heading">
        <h2 id="dialog-title">{title}</h2>
        <button onClick={onClose} aria-label="Close dialog">
          ✕
        </button>
      </header>
      {children}
    </dialog>
  );
}
