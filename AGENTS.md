# AGENTS.md — Nativefy

Guidelines for AI agents and contributors working on this codebase.

---

## What this project is

A React Native + Expo WebView shell. It has one job: load a URL in a WebView and expose a native bridge (`window.nativefy`) to the web app. There is intentionally very little code — keep it that way.

---

## Architecture

```
App.tsx
  └─ useOneSignal()          # All OneSignal SDK interactions
  └─ <AppWebView>
       └─ NativefyWebView    # WebView wrapped with withJavascriptInterface
            └─ nativefyProxy # Stable proxy → implRef.current (updated each render)
```

**Critical pattern — do not change without understanding it:**

`NativefyWebView` is created **once at module level** in `AppWebView.tsx`. It uses a stable proxy object (`nativefyProxy`) that delegates to a mutable `implRef.current`. This is necessary because `withJavascriptInterface` creates a new React component type — if called inside the render function, the WebView would remount on every re-render, losing state and reloading the page.

---

## Key files

| File | Role |
|------|------|
| `src/types/bridge.ts` | `NativefyInterface` — the contract between native and web. Changes here affect both sides. |
| `src/hooks/useOneSignal.ts` | Wraps the OneSignal SDK. All SDK calls go through here. |
| `src/components/AppWebView.tsx` | WebView component with bridge, error fallback, and reload logic. |
| `App.tsx` | Root component. Orchestrates splash screen lifecycle and wires the hook to the component. |
| `app.config.js` | Expo config. `onesignal-expo-plugin` must stay first in the plugins array. |

---

## Rules

**Adding a method to the bridge:**
1. Add the signature to `NativefyInterface` in `src/types/bridge.ts`
2. Implement it in `useOneSignal.ts` and add it to the hook's return type
3. Wire it in the `implRef.current = { ... }` block inside `AppWebView.tsx`
4. That's it — the web side gets it automatically via the proxy

**Do not:**
- Move `NativefyWebView` or `nativefyProxy` inside the component function
- Call `withJavascriptInterface` inside a render or inside `useMemo`
- Add business logic to `AppWebView.tsx` — it should only wire the hook to the WebView
- Add features not related to the bridge or push notifications
- Wrap the app in a navigation library — this is a single-screen shell by design

**OneSignal:**
- Always call `OneSignal.initialize()` once — the `initialized` ref in `useOneSignal.ts` guards against double init
- `onesignal-expo-plugin` must remain the first plugin in `app.config.js` or the native build will fail
- The SDK requires a native build; do not attempt to test OneSignal features in Expo Go

**Environment variables:**
- `EXPO_PUBLIC_*` variables are bundled into the app at build time and accessible at runtime via `process.env`
- `APP_BUNDLE_ID` is only used during `expo prebuild` — it is not available at runtime
- Never commit `.env` — only `.env.example` is tracked

---

## Build requirements

This project uses Expo's managed workflow with native modules that require a custom native build:

```bash
npx expo prebuild --clean   # generates ios/ and android/ — gitignored
npx expo run:ios            # builds and installs on simulator or device
npx expo run:android
```

`ios/` and `android/` are excluded from git. Always regenerate them with `expo prebuild` rather than editing native files directly.

---

## Dependencies — why each one exists

| Package | Why |
|---------|-----|
| `react-native-webview` | The WebView component |
| `react-native-webview-comlink` | RPC bridge over postMessage — eliminates manual message serialization |
| `react-native-onesignal` | OneSignal SDK for push notifications |
| `onesignal-expo-plugin` | Configures native iOS/Android OneSignal setup during prebuild |
| `expo-splash-screen` | Programmatic splash control — hides only after WebView loads |
| `expo-status-bar` | Status bar tinting |

Do not add dependencies without a clear reason. This template is intentionally minimal.
