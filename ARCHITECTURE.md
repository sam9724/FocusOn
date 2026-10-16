# Architecture

## Boundaries

`src/features/timer/engine.ts` is pure TypeScript: start, pause, remaining time, extension and deadline reconciliation. Time is passed in explicitly. A running timer stores an epoch-millisecond `endAt`; periodic React updates redraw it but do not decrement persisted state. Pause snapshots the remaining duration; resume creates a new deadline. A focus deadline starts a break at that deadline, so sleep does not prolong the session or create a new break hours later. Starter completion stays idle until the user chooses a full session. After a completed break the controller returns to the configured idle focus timer.

`useTimer` is mounted at app level and reconciles on an interval, focus and visibility changes, regardless of the current screen. Completed transitions are persisted once. Audio is unlocked on a user gesture, not at launch. The notification adapter chooses Web Notifications or Capacitor local schedules. Cancelling/replacing native alarm IDs is serialized. Focus and following-break alerts are scheduled together so suspension need not run JavaScript at the transition. Notification text never contains task notes or titles.

`src/features/tasks/taskLogic.ts` contains filtering, deterministic-injected random choice and ordering. Views use stable IDs; size is deliberately the MVP energy heuristic. Visible reordering swaps order values between visible neighbors while preserving hidden task order. A running/paused task cannot be silently swapped.

`src/lib/model.ts` defines Zod runtime validation and inferred strict TypeScript types. There is no `any`. The version-1 export is the whole domain snapshot: tasks, categories, settings, timer and selected ID. No untrusted HTML is rendered. Imports reject unknown fields, malformed ranges, duplicates, dangling references and unsupported versions; a future schema must have explicit migrations.

`src/db/database.ts` owns the versioned Dexie schema. One snapshot record is intentionally used for the small local MVP: task, selection and timer changes are atomic at the record boundary, and restoration is a single write. Zustand is the in-memory view model; writes are serialized to prevent old snapshots overtaking newer ones. Import waits for pending writes and only updates the UI after persistence succeeds. Save failures remain visible and allow export/retry. Startup read failure never silently resets saved content. Large-volume histories should use separate indexed tables and transactional migrations rather than grow this snapshot indefinitely.

`SingleWindow` holds a Web Lock while the app is open to prevent concurrent stale-snapshot writers. Unsupported older platforms fall back to a single-window usage recommendation. There is no cross-device sync or backend. Undo is a single in-memory deleted-task snapshot; reset/import clear it. Category deletion safely reassigns tasks.

## UI and offline shell

React + Vite produces static assets with local system fonts. The centered responsive layout uses semantic controls, an off-screen skip link, visible focus rings, native modal dialogs, safe-area padding and no essential animation. The circular display uses a CSS conic gradient; its screen-reader timer is not a constantly interrupting live region. Brief completion feedback uses a polite status region. Preferences respect device theme and reduced motion. The only completion statistic is a local-day count, derived from task completion timestamps.

`vite-plugin-pwa` generates a Workbox precache containing HTML, JavaScript, CSS, manifest and icons, including dynamically imported native adapters. No CDN fonts or remote assets are required. The update prompt leaves reload timing to the user. IndexedDB and the service-worker cache have separate lifetimes; an app update never deletes task data. Native wrappers load the same Vite `dist/`; Capacitor is configured for native notification plugins, while Tauri exposes no privileged application commands.

## Extension points after MVP

- **Daily top three:** add a dated plan table referencing existing task IDs, cap the visible plan at three, and keep it optional. Avoid overdue carryover language.
- **Weekly minutes:** add idempotent session-completion records keyed by session UUID, including actual focused time and local completion date. Do not infer historical focused time from task completion or time spent asleep. Use a simple seven-day total, without streaks.
- **Body doubling:** a local quiet screen can share the controller and timer state. No simulated online person, microphone, account or networking is needed.
- **Widgets:** Android AppWidget/Glance and iOS WidgetKit need native platform code, shared app-group/local storage bridges, and explicit widget timelines. A PWA shortcut can open Now, but is not a real live home-screen widget. Windows can use a PWA launch shortcut initially. Keep the pure timer engine authoritative and avoid duplicating decrementing timers in widgets.
- **Windows background alerts:** implement a Tauri OS alarm adapter if needed; do not promise browser-delivered alarms after closing the app.

## Tradeoffs

Deadlines survive suspension and reload, but changing the device clock changes the perceived remaining time. Browser storage is best effort even after a persistence request. There is no reliable offline cross-browser scheduled local-notification API, so a closed PWA cannot guarantee an alarm. Adding a server or push provider would violate this product's constraints. The recommended background-alert path is the optional native Capacitor wrapper with OS permissions, still subject to OS policy.
