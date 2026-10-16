import { useEffect, useState } from "react";
import { useFocus } from "../../store/useFocus";
import { freshTimer, minute, reconcile } from "./engine";
import { feedback, unlockAudio } from "../../lib/feedback";
import {
  notifyCompletion,
  syncNotifications,
} from "../notifications/notifications";
export function useTimer() {
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("A little space to begin.");
  const data = useFocus((s) => s.data);
  const ready = useFocus((s) => s.ready);
  useEffect(() => {
    const unlock = () => {
      if (useFocus.getState().data.settings.sound) unlockAudio();
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);
  useEffect(() => {
    if (ready)
      void syncNotifications(data.timer, data.settings).catch(() =>
        setMessage(
          "The timer works here, but a background notification could not be scheduled.",
        ),
      );
  }, [data.timer, data.settings, ready]);
  useEffect(() => {
    const tick = () => {
      const time = Date.now();
      setNow(time);
      const s = useFocus.getState();
      if (!s.ready || s.replacing) return;
      const result = reconcile(
        s.data.timer,
        time,
        s.data.settings.breakMinutes,
      );
      if (result.completed) {
        const timer =
          result.timer.phase === "break" && result.timer.status === "idle"
            ? freshTimer(
                s.data.settings.focusMinutes * minute,
                "focus",
                s.data.selectedId,
              )
            : result.timer;
        s.setTimer(timer);
        const message =
          result.completed === "starter"
            ? "You began. That counts. Continue when you’re ready."
            : result.completed === "focus"
              ? "A little progress, made. Take a breath."
              : "Break complete. Come back gently.";
        setMessage(message);
        feedback(s.data.settings);
        void notifyCompletion(message, s.data.settings).catch(() =>
          setMessage(`${message} Notification unavailable.`),
        );
      }
    };
    tick();
    const id = window.setInterval(tick, 500);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return { now, message, setMessage };
}
