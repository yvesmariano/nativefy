# Nativefy

A React Native + Expo template that acts as a native shell for any web app. It loads the web application inside a WebView and exposes a typed, bidirectional JavaScript bridge as `window.nativefy`.

The primary use case is linking the logged-in web app user to [OneSignal](https://onesignal.com/) for targeted push notifications.

---

## How it works

```
[WebApp — window.nativefy]              [React Native — OneSignal SDK]
         |                                          |
         | await window.nativefy                    |
         |   .login('user-123')  ── RPC bridge ──>  |
         |                                          | OneSignal.login('user-123')
         |                                          |
         | await window.nativefy                    |
         |   .getOneSignalId()   ── RPC bridge ──>  |
         |<─── Promise<string> ─────────────────────| pushSubscription.id
```

The bridge is injected automatically before content loads, making `window.nativefy` available as soon as the page runs.

---

## Requirements

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Physical device or simulator (Expo Go is **not** supported — requires a native build)
- A [OneSignal](https://onesignal.com/) account with an app created

---

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env`:

```bash
EXPO_PUBLIC_WEB_URL=https://your-webapp.com
EXPO_PUBLIC_ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APP_BUNDLE_ID=com.company.nativefy
```

**3. Generate native code**

```bash
npx expo prebuild --clean
```

**4. Run on device**

```bash
npx expo run:ios
# or
npx expo run:android
```

---

## The `window.nativefy` interface

The interface is available globally in the webapp loaded inside the WebView:

```typescript
// Link user after login
await window.nativefy.login('user-123', 'user@email.com');

// Get OneSignal ID to store in your backend
const oneSignalId = await window.nativefy.getOneSignalId();
await api.post('/users/device', { oneSignalId });

// Request push notification permission (iOS)
const granted = await window.nativefy.requestNotificationPermission();

// Unlink user on logout
await window.nativefy.logout();
```

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `login` | `userId: string, email?: string` | `Promise<void>` | Links the user to OneSignal |
| `logout` | — | `Promise<void>` | Unlinks the user from OneSignal |
| `getOneSignalId` | — | `Promise<string \| null>` | Returns the device's Subscription ID |
| `requestNotificationPermission` | — | `Promise<boolean>` | Requests push permission (iOS) |

### TypeScript types for the web project

Copy `src/types/bridge.ts` to your web project and declare `window.nativefy`:

```typescript
import { NativefyInterface } from './bridge';

declare global {
  interface Window {
    nativefy: {
      [K in keyof NativefyInterface]: (...args: Parameters<NativefyInterface[K]>) => ReturnType<NativefyInterface[K]>;
    };
  }
}
```

---

## Project structure

```
nativefy/
├── app.config.js              # Expo config (plugins, bundle ID, splash)
├── index.ts                   # Entry point (registerRootComponent)
├── App.tsx                    # Root: SplashScreen + OneSignal init + WebView
├── assets/
│   ├── icon.png               # App icon (1024×1024)
│   ├── splash-icon.png        # Splash screen image (200×200)
│   └── adaptive-icon.png      # Android adaptive icon (1024×1024)
└── src/
    ├── types/
    │   └── bridge.ts          # NativefyInterface — shared between native and web
    ├── hooks/
    │   └── useOneSignal.ts    # Hook: OneSignal initialization and operations
    └── components/
        └── AppWebView.tsx     # WebView with nativefy bridge + error fallback
```

---

## Verification checklist

1. **Splash screen** — appears on launch and hides after the WebView finishes loading (`onLoadEnd`)
2. **Bridge login** — in the webapp console: `await window.nativefy.login('test-123')` → confirm `OneSignal.login('test-123')` is called on the native side
3. **Bridge getOneSignalId** — `await window.nativefy.getOneSignalId()` → returns a non-null string on a device with permission granted
4. **Push notification** — from the OneSignal dashboard, send a push by External ID `test-123` → arrives on device
5. **Bridge logout** — `await window.nativefy.logout()` → `OneSignal.logout()` called
6. **Network error** — disable internet and launch app → WebView shows error fallback with a reload button; splash does not hang

---

## Notes

- `onesignal-expo-plugin` must always be the **first** plugin in `app.config.js`
- Requires a native build via `expo prebuild`; **does not work in Expo Go**
- The bridge is restricted to the URL set in `EXPO_PUBLIC_WEB_URL` — links outside that origin open in the system browser
- Assets in `assets/` are white placeholders — replace with real icons before publishing
