# Watchlog React RUM

📊 A lightweight, production-ready Real User Monitoring (RUM) SDK for React apps, powered by **Watchlog**.

Automatically track SPA route changes, session durations, page views, custom events, and JavaScript errors — with a single React hook.

---

## ✨ Features

* 📍 **Normalized dynamic routes**: automatically transforms routes like `/users/123` into `/users/:id`.
* 🔁 **SPA route tracking**: emits `page_view` on every React Router v6+ navigation.
* 🧠 **Event types**: `session_start`, `page_view`, `session_end`, `custom`, and `error`.
* ⚠️ **Error monitoring**: auto-captures `window.onerror` and `unhandledrejection`.
* 🔄 **Minimal API**: setup via one hook, plus manual control if needed.

---

## 🛠 Installation

```bash
npm install watchlog-react-rum
```

---

## ⚙️ Usage

### Hook-based setup (recommended)

Use the `useWatchlogRUM` hook in your app’s root component to initialize and auto-track:

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { useWatchlogRUM } from 'watchlog-react-rum';

function Root() {
  useWatchlogRUM({
    apiKey: 'YOUR_API_KEY',
    endpoint: 'https://your-endpoint.com/rum',
    app: 'your-app-name',
    debug: false,
    flushInterval: 5000, // ms
  });

  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
```

This will automatically send:

1. `session_start` on first load (with normalized path)
2. `page_view` on every route change
3. `session_end` on unload
4. `error` for uncaught JS errors and unhandled promise rejections

### Manual API (optional)

If you prefer manual setup, import and initialize the core SDK directly:

```js
import WatchlogRUM from 'watchlog-react-rum';

// Initialize once at app startup
WatchlogRUM.init({
  apiKey: 'YOUR_API_KEY',
  endpoint: 'https://your-endpoint.com/rum',
  app: 'your-app-name',
  debug: true,
  flushInterval: 10000,
});

// Send a custom metric anywhere
WatchlogRUM.custom('button_clicked', 1);

// Flush buffered events (e.g. before manual unload)
WatchlogRUM.flush(true);
```

---

## 📦 Exports

| Module                                                | Description                                        |
| ----------------------------------------------------- | -------------------------------------------------- |
| `import WatchlogRUM from 'watchlog-react-rum'`        | Core SDK: `init`, `bufferEvent`, `custom`, `flush` |
| `import { useWatchlogRUM } from 'watchlog-react-rum'` | React hook for auto SPA tracking                   |

---

Made with ❤️ by Watchlog team | [watchlog.io](https://watchlog.io)
