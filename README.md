# One Thing Focus

A calm, private focus timer and task list. One task on the Now screen. No login, backend, ads, analytics, subscriptions, tracking, or runtime third-party requests. MIT licensed. The installable PWA is the primary product for Windows, iOS and Android.

## Start here

Install the free, open-source Node.js 22 LTS or newer. From this folder:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. To check the **production offline app**:

```sh
npm run build
npm run preview
```

Open http://127.0.0.1:4173 once online, wait for “Available offline”, then try airplane mode and reload. Service workers are deliberately disabled in the development server. Dependencies are required at build time; the built app needs no network after its first successful cache. Do not open `dist/index.html` using `file://`.

## What is included

- Timestamp-based focus timer, pause/resume, reset, +5 minutes; 10/15/25/45 minute presets and custom 1–180 minutes.
- Two-minute starter with an explicit option to start a **fresh full session**. Starter time is a warm-up and is not deducted from the full session.
- Automatic 0–60 minute breaks (default 5). Set zero to disable. After a break, return to an idle focus timer. Overslept breaks are not replayed.
- Task title, category, size, notes and completion; quick add, edit, delete, reorder buttons and undo the most recent deletion. Undo lasts until the app is closed or a backup/reset/category deletion clears it.
- Four editable default categories, energy suggestions and random selection respecting both filters. Low → Tiny, Medium → Medium, High → Big. No match shows a gentle empty state; filters are never silently ignored.
- A local-calendar “done today” count based on tasks currently marked done. No streaks, overdue warnings or scoring.
- Gentle synthesized sound, supported-device vibration, explicit notification opt-in, system/light/dark themes and reduced motion.
- IndexedDB persistence, validated JSON backups, confirmation before import/reset, storage protection request, and visible save failures with retry/export.
- PWA install/update handling, Capacitor configuration and Tauri 2 Windows scaffold.

Task switching asks you to reset a running or paused timer first. The timer keeps working while Tasks or Settings is open. Session completion does not automatically complete the task. Reopening a task removes it from the done count; completing it again counts it on its new completion date.

## Install for free

| Platform      | Install the PWA                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Windows       | Open the HTTPS URL in Edge or Chrome → browser menu → Install app / Apps → Install this site as an app. Pin it to Start or the taskbar. |
| Android       | Open in Chrome → menu → Install app / Add to Home screen.                                                                               |
| iPhone / iPad | Open in Safari → Share → Add to Home Screen → Open as Web App if offered. Launch from the home screen.                                  |

The browser may vary the menu wording. “How to install” is also in the app. HTTPS is mandatory except on localhost. A phone opening your PC's LAN HTTP address is not a secure installation test; use the deployed HTTPS site. A PWA and a native wrapper have **separate local databases**; transfer data with JSON.

## Deploy to GitHub Pages (free)

1. Create a **public GitHub repository**, put the contents of this folder at its root and push to `main`. No app secrets are required. This package does not create a repository or publish on your behalf.
2. In repository Settings → Pages → Build and deployment, choose **GitHub Actions**.
3. The included workflow runs formatting, lint, strict typecheck, unit/component tests, production build and browser/offline/accessibility tests before deploying. Pull requests run checks but do not deploy.
4. Visit `https://YOUR-NAME.github.io/YOUR-REPOSITORY/` and install. No backend or API key is needed.

The workflow sets `BASE_PATH` to the repository subpath. For a `YOUR-NAME.github.io` repository or a custom domain, set both workflow `BASE_PATH` and `E2E_BASE_PATH` to `/`. The default local/native build uses relative paths. Never put exports, task data or secrets into the repository. GitHub hosting serves static assets only; all task data stays in the browser database.

## Development commands

```sh
npm test                 # Vitest + Testing Library
npm run test:watch
npm run typecheck
npm run lint
npm run format
npm run format:check
npm run test:e2e         # builds and runs browser, offline and axe checks
npm run audit           # Lighthouse against an already running preview server
```

For browser tests, run `npx playwright install chromium` first. To use installed Chrome on Windows instead:

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test:e2e
```

Space starts/pauses on Now when focus is outside interactive controls. N opens quick add without intercepting typing. All controls support keyboard focus. Dialogs trap focus using native HTML dialog behavior and return focus to their opener. See [TESTING.md](TESTING.md) for verification and release checks.

## Android wrapper (optional)

The PWA requires no wrapper. To build a local Android app, install free Android Studio and its SDK/JDK, then:

```sh
npm run build
npx cap add android
node scripts/prepare-native.mjs
npx cap sync android
npx cap open android
```

`prepare-native.mjs` copies the supplied monochrome status icon and generated gentle sound into the generated Android project. In `android/app/src/main/AndroidManifest.xml`, add the following directly inside `<manifest>` (outside `<application>`):

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

Run on a device from Android Studio. To build a debug APK from a terminal, change into `android`, then run `./gradlew assembleDebug` (PowerShell: `.\gradlew.bat assembleDebug`). Sideloading locally does not require a store account. Release signing uses your own local key; never commit it. After web changes, run `npm run cap:sync`. Enable notifications inside Settings and, for precise alarms, grant the app “Alarms & reminders” access in Android Settings. OS power policies and Doze can still delay alerts. No exact-alarm permission is silently requested at launch.

## iOS wrapper (optional, requires macOS)

On a Mac with Xcode and the Capacitor-required CocoaPods tools:

```sh
npm run build
npx cap add ios
node scripts/prepare-native.mjs
npx cap sync ios
npx cap open ios
```

Add `native/gentle.wav` to the App target in Xcode with **Copy items if needed** and confirm it is in **Copy Bundle Resources**. Select a simulator and run. For your own device, select your personal signing team. Then enable notifications in app Settings and allow the OS prompt. Apple may require periodic reprovisioning for personal-device builds. Native iOS background vibration follows OS notification/silent-mode policies.

**Cost boundary:** the PWA is free to build, host on public GitHub Pages, install and run on all three platforms without an app account. Native iOS requires Apple's vendor tooling and hardware; public App Store distribution is subject to Apple's paid membership rules. Native wrappers are optional and are not a promise of a free App Store release. No paid distribution service is required by this codebase. See [PLATFORM_LIMITATIONS.md](PLATFORM_LIMITATIONS.md).

## Windows Tauri 2 wrapper (optional)

The Windows PWA is the recommended free installation. For an executable, install Rust stable with the MSVC toolchain, Visual Studio C++ Build Tools and WebView2 as described in [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/):

```sh
npm ci
npm run tauri dev
npm run tauri build
```

The included `src-tauri/` is a complete minimal Rust host with configuration, capabilities and icons. Windows installers go under `src-tauri/target/release/bundle`. It intentionally has no shell, filesystem or remote API privileges. No native Windows alarm integration is included; the PWA/browser notification limitations apply to this optional host. Unsigned executables may show Windows SmartScreen. Code signing is optional and is not needed for a personal local build. Native builds must be validated on the target toolchain; they have not been built in this delivery environment.

## Privacy, backup and recovery

The app makes no analytics, account, advertising, push-service or third-party runtime calls. Sound is generated locally. All fonts are system fonts. The service worker caches only the packaged application. IndexedDB is not encrypted; use device security for private notes. JSON exports are plaintext. Browser/OS storage eviction, clearing site data, private browsing, changing the deployment origin or uninstalling can lose local data. Export regularly. “Protect local storage” requests persistence but cannot force the browser to grant it.

Import validates the full versioned snapshot, file size, ranges, unique IDs and task/category references **before** any write. It replaces data atomically after confirmation. Running imported timers are paused and notification opt-in is cleared. Reset replaces the app snapshot with defaults after typing RESET. It does not remove exported files, browser notification permissions or installation caches. If storage cannot be opened, the app does not overwrite it. If a later write fails, export your visible data, free space, and retry saving.

Only one window writes at a time where Web Locks are supported. A second window explains how to switch. On older browsers without Web Locks, keep only one app window open. Device wall-clock changes affect timestamp timers; no internet time or server is used.

## Roadmap

The MVP intentionally leaves top-three planning, focus-minute history, body doubling and widgets for later. [ARCHITECTURE.md](ARCHITECTURE.md) describes extension boundaries and ideas without shipping placeholder controls.
