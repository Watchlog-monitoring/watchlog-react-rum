# Watchlog React RUM

📊 A lightweight and production-ready Real User Monitoring (RUM) SDK for React apps powered by **[Watchlog](https://watchlog.io)**.

Track route changes, page views, session durations, custom events, JavaScript errors, and page load performance — with just one component.

---

## ✨ Features

- 📍 Tracks **normalized routes** automatically (e.g. `/users/:id`, `/products/:slug`)
- ⚡ Captures page performance metrics: `ttfb`, `domLoad`, `load`
- 🔁 Tracks **SPA route changes** with React Router v6+
- 🧠 Sends events: `session_start`, `route_change`, `page_view`, `session_end`, `custom`, and `error`
- 🛠 Auto-captures `window.onerror` and `unhandledrejection`
- 💬 Minimal API surface with a single `<WatchlogProvider />`

---

## 🛠 Installation

```bash
npm install watchlog-react-rum
```

---

## ⚙️ Setup

### 1. Initialize the SDK

Inside your app entry (e.g. `main.jsx` or `App.jsx`):

```js
import WatchlogRUM from 'watchlog-react-rum'

WatchlogRUM.init({
  apiKey: 'your-api-key',
  endpoint: 'https://your-server.com/rum',
  app: 'your-app-name',
  debug: false
})
```

---

### 2. Wrap your app with `<WatchlogProvider />`

Place it at the top of your app layout (must be within `RouterProvider`):

```jsx
import { Outlet } from 'react-router-dom'
import WatchlogProvider from 'watchlog-react-rum/WatchlogProvider'

function Layout() {
  return (
    <>
      <WatchlogProvider />
      <Outlet />
    </>
  )
}
```

---

## 🧩 Optional: Manual tracking per route

If you want to manually control tracking instead of using `<WatchlogProvider />`, you can use the hook:

```jsx
import useWatchlogRUM from 'watchlog-react-rum/useWatchlogRUM'

function MyPage() {
  useWatchlogRUM()

  return <div>...</div>
}
```

---

## 📬 Custom Events

```js
WatchlogRUM.custom('button_clicked', 1)
```

---

## 📦 Exported Modules

| Import | Description |
|--------|-------------|
| `watchlog-react-rum` | Core SDK (`init`, `bufferEvent`, `custom`, `flush`) |
| `watchlog-react-rum/WatchlogProvider` | React component with full auto tracking |
| `watchlog-react-rum/useWatchlogRUM` | Hook for manual usage per route |

---
