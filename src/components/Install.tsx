import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function Install() {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [help, setHelp] = useState(false);
  const {
    needRefresh: [update],
    offlineReady: [offline],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    const installed = () => setInstall(null);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  return (
    <div className="install-area">
      {offline && <span>Available offline</span>}
      {update && (
        <button onClick={() => void updateServiceWorker(true)}>
          Update ready · reload when you’re ready
        </button>
      )}
      {install ? (
        <button
          onClick={() => {
            void install
              .prompt()
              .then(() => install.userChoice)
              .finally(() => setInstall(null));
          }}
        >
          Install app
        </button>
      ) : (
        <button onClick={() => setHelp(!help)} aria-expanded={help}>
          How to install
        </button>
      )}
      {help && (
        <p>
          Windows / Android: use your browser menu → Install app. iPhone / iPad:
          Safari → Share → Add to Home Screen. Open once online before using
          offline.
        </p>
      )}
    </div>
  );
}
