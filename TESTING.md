# Testing and release checks

## Automated checks

```sh
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test
npm run test:e2e
```

The test suite separates pure domain tests, fake-IndexedDB persistence tests, React Testing Library user flows and real Chromium browser checks. Vitest includes only `src/**/*.test.{ts,tsx}`; Playwright owns `e2e/`.

| Layer         | What it checks                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timer engine  | Timestamp accuracy after long suspension; pause/resume; extension; automatic break deadline; starter behavior; no repeated transition.                                                      |
| Tasks / Dexie | Create/edit/reorder/delete/undo, title validation, category/energy/done filters, injected random choice, and persistence through a new database connection.                                 |
| JSON backups  | Round trip, paused restored timers, cleared notification opt-in, file-size bound, malformed JSON, duplicate IDs, dangling references, unsupported versions.                                 |
| Notifications | Unsupported browser behavior and permission requested only through explicit invocation.                                                                                                     |
| UI            | Quick add → select → start → pause → complete; N shortcut without intercepting typing; preference changes and new categories.                                                               |
| Browser       | Installed-shell caching and offline reload with stored tasks; running-timer reload; second-window lock; completion while another screen is open; responsive overflow and axe WCAG AA scans. |

Playwright needs its Chromium download (`npx playwright install chromium`) or `CHROME_PATH` pointing to a local Chrome executable. CI installs Chromium explicitly. To test a GitHub Pages subpath locally, build with `BASE_PATH=/your-repository/` and run Playwright with `E2E_BASE_PATH=/your-repository/`.

## Performance and PWA

Build, run `npm run preview` in one terminal, then `npm run audit` in another. Set `CHROME_PATH` if browser discovery cannot find Chrome. `AUDIT_URL` can target a deployed URL or subpath. The runner writes local `reports/lighthouse.html` and `reports/lighthouse.json`, prints category scores, and fails below 90 Performance or Accessibility. Reports are not tracked. Modern Lighthouse has no numeric PWA score.

Separately inspect the generated manifest, 192/512/maskable and Apple icons, service worker scope, offline start URL, install menus and update prompt. Test the production build, not Vite development mode. Use a clean browser profile; installed extensions, CPU load and throttling affect Lighthouse scores. The source package records delivery verification in `VERIFICATION.md`.

## Manual accessibility checks before a public release

- Use only the keyboard: skip link, navigation, preset selection, quick add, edit dialogs, category management, import/reset confirmations, undo, Space and N. Escape closes dialogs; focus returns to their opener.
- Test at 200% and 400% browser zoom, increased OS text size, 320px width and landscape. No essential control should become unreachable or depend on horizontal scrolling.
- Verify light/dark/system modes, high-contrast/forced-colors mode, visible focus, and both device/app reduced-motion settings.
- Use VoiceOver on iPhone and TalkBack on Android. Timer output should be discoverable but not announce every second; completion text should be polite and concise. Status text must not rely on color.
- Check touch targets are at least 44 CSS pixels including checkbox label hit areas; test safe areas on a notched device.

## Platform / resilience matrix

- Start a one-minute session; background for 30 seconds, lock/sleep beyond the deadline, return, and inspect the remaining break time. Sleep beyond both focus and break; verify idle focus with no replay loop.
- Pause before backgrounding; verify paused time does not elapse. Extend/reset while native notifications are enabled and confirm the old deadline is cancelled.
- Deny notifications, turn notifications off, revoke permission in OS settings, and retry. The app must remain usable with visual feedback.
- On native Android/iOS hardware, test foreground/background/locked delivery, sound/vibration preferences, Doze/Focus modes and exact-alarm settings. Simulator-only tests are insufficient.
- Export a backup, import it on another device/browser, confirm task fields and preferences, and confirm no notification starts without opt-in. Verify native file export on both OSes before native release.
- Reject a corrupt/oversized/future backup without touching existing data. Cancel a valid restore. Confirm reset requires typing RESET and does not reset on Escape.
- Simulate a failed IndexedDB write or quota exhaustion. Expect visible error, working export, and successful retry after recovery. Opening an unreadable DB must not overwrite it with defaults.
- Reorder with filters applied. Rename/delete a category with tasks; tasks must be retained. Delete/reopen/done actions should update the local-day count predictably.
- Test a service-worker update while paused/running, then reload and verify state continuity. Close the primary app window and reload a blocked second window.

## Build scope

The PWA can be built and browser-tested in this workspace. Android, iOS and Tauri native builds depend on SDKs outside the TypeScript toolchain and require target-platform verification. The repository includes setup and configuration for them; do not interpret a green web CI run as native-device certification. Signed installers and store publishing are outside this source deliverable.
