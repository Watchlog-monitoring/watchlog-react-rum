# Watchlog React RUM

📊 A comprehensive, production-ready **Real User Monitoring (RUM)** SDK for React apps — powered by [**Watchlog**](https://watchlog.io/products/rum).

Automatically track SPA route changes, performance metrics, user interactions, network requests, errors, and much more with zero configuration. Built to match the capabilities of DataDog and Sentry RUM.

---

## ✨ Features

### Core Tracking
* 📍 **Normalized dynamic routes**: automatically transforms routes like `/users/123` into `/users/:id`
* 🔁 **SPA route tracking**: emits `page_view` on every React Router navigation
* 🧠 **Event types**: `session_start`, `page_view`, `session_end`, `custom`, `error`, `performance`, `network`, `resource`, `longtask`, `web_vital`, `interaction`
* ⚠️ **Comprehensive error monitoring**: auto-captures `window.onerror`, `unhandledrejection`, and React component errors
* 🍞 **Breadcrumbs**: automatic event breadcrumbs for debugging

### Performance Monitoring
* ⚡ **Web Vitals**: CLS, LCP, INP, TTFB, FID (via web-vitals package)
* 🎨 **Paint Metrics**: First Paint (FP) and First Contentful Paint (FCP)
* 📊 **Navigation Timing**: Complete breakdown (DNS, TCP, request, response, processing, load)
* 🔍 **Resource Timing**: Track all resource loads with detailed timing and size information
* ⏱️ **Long Tasks**: Detect and track long-running JavaScript tasks (>50ms)

### Network Monitoring
* 🌐 **Fetch/XHR Tracking**: Automatic interception with sampling
* 📦 **Request/Response Sizes**: Track transfer sizes, encoded/decoded body sizes
* ⏱️ **Timing Breakdown**: DNS, TCP, request, response timing for each network call
* 🎯 **Status Tracking**: HTTP status codes and success/failure rates

### User Interaction Tracking
* 🖱️ **Click Events**: Track user clicks (sampled)
* 📜 **Scroll Depth**: Monitor scroll progress (25%, 50%, 75%, 100%)
* 📝 **Form Submissions**: Track form interactions

### Rich Context Data
* 💻 **Device Information**: Screen size, viewport, pixel ratio, color depth
* 🌐 **Browser/OS Detection**: Automatic browser and OS identification
* 📡 **Connection Info**: Network type, downlink, RTT, save-data mode
* 💾 **Memory Info**: Device memory and hardware concurrency (when available)
* 🎨 **Color Scheme**: Dark/light mode detection
* 🌍 **Timezone**: Automatic timezone and offset detection

### Error Tracking
* 🎯 **React Error Handler**: Automatic React component error capture
* 📋 **Component Context**: Component name and props in error context
* 🔗 **Stack Traces**: Full stack traces with source file information
* 🍞 **Error Breadcrumbs**: Automatic breadcrumbs leading to errors

---

## 🛠 Installation

```bash
npm install watchlog-react-rum
```

**Optional**: For Web Vitals support (CLS, LCP, INP, TTFB, FID):
```bash
npm install web-vitals
```

---

## ⚙️ Usage

### Option 1: Hook-based setup with RouterProvider (recommended for accurate route normalization)

For the most accurate route pattern detection (like Datadog), use the wrapped router functions from `watchlog-react-rum/react-router-v6`:

```jsx
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { createBrowserRouter } from 'watchlog-react-rum/react-router-v6'
import { useWatchlogRUM } from 'watchlog-react-rum'
import App from './App'
import Home from './pages/Home'
import UserDetail from './pages/UserDetail'
import PostDetail from './pages/PostDetail'

// Create router with route definitions (for accurate route pattern extraction)
// IMPORTANT: Use createBrowserRouter from 'watchlog-react-rum/react-router-v6'
// This ensures route patterns are captured for accurate normalization
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'users/:userId', // This exact pattern will be used for normalization
        element: <UserDetail />,
      },
      {
        path: 'posts/:postId',
        element: <PostDetail />,
      },
    ],
  },
])

// Root component to initialize RUM tracking
function Root() {
  useWatchlogRUM({
    apiKey: 'YOUR_API_KEY',
    endpoint: 'https://your-endpoint.com/rum',
    app: 'your-app-name',
    environment: 'production', // optional
    release: '1.0.0', // optional
    debug: false,
    flushInterval: 10000, // ms
    sampleRate: 0.5, // 0.0 to 1.0 - session sampling (max: 0.5 to prevent server overload)
    networkSampleRate: 0.1, // 0.0 to 1.0 - network request sampling (recommended: 0.1)
    interactionSampleRate: 0.1, // 0.0 to 1.0 - user interaction sampling (recommended: 0.1)
    enableWebVitals: true,
    captureLongTasks: true,
    captureFetch: true,
    captureXHR: true,
    captureUserInteractions: false, // Set to true to enable click/scroll tracking
    captureBreadcrumbs: true,
    maxBreadcrumbs: 100,
    beforeSend: (event) => {
      // Optional: filter or modify events before sending
      // Return null to drop the event
      return event
    }
  })

  return <RouterProvider router={router} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
```

**Important**: Using the wrapped `createBrowserRouter` from `watchlog-react-rum/react-router-v6` ensures that route patterns (like `/users/:userId` or `/users/:uuid`) are extracted directly from your route definitions, providing the most accurate normalization.

### Option 1b: Hook-based setup with BrowserRouter (fallback)

If you're using `BrowserRouter` instead of `RouterProvider`, the SDK will still work but will use params-based route reconstruction:

```jsx
// src/App.jsx
import { BrowserRouter } from 'react-router-dom'
import { useWatchlogRUM } from 'watchlog-react-rum'

function App() {
  useWatchlogRUM({
    apiKey: 'YOUR_API_KEY',
    endpoint: 'https://your-endpoint.com/rum',
    app: 'your-app-name',
    // ... other config options
  })

  return (
    <BrowserRouter>
      {/* Your app routes */}
    </BrowserRouter>
  )
}

export default App
```

This automatically sends:
1. `session_start` on first load (with normalized path and referrer)
2. `page_view` on every route change
3. `session_end` on unload
4. `error` for uncaught JS errors, unhandled promise rejections, and React component errors
5. `performance` metrics on each page load
6. `web_vital` metrics (CLS, LCP, INP, TTFB, FID, FCP, FP)
7. `network` requests (fetch/XHR) with detailed timing
8. `resource` loads (images, scripts, stylesheets, etc.)
9. `longtask` events when JavaScript blocks the main thread
10. `interaction` events (if enabled)

---

### Option 2: Manual SDK API (advanced)

```js
import WatchlogRUM from 'watchlog-react-rum'

// Initialize once at app startup
WatchlogRUM.init({
  apiKey: 'YOUR_API_KEY',
  endpoint: 'https://your-endpoint.com/rum',
  app: 'your-app-name',
  debug: true,
  flushInterval: 10000,
})

// Send custom metric
WatchlogRUM.custom('button_clicked', 1, { extra: 'data' })

// Manually capture errors
WatchlogRUM.captureError(new Error('Something went wrong'), {
  component: 'MyComponent',
  props: { userId: 123 }
})

// Add breadcrumbs
WatchlogRUM.addBreadcrumb('user', 'User clicked button', 'info', {
  buttonId: 'submit'
})

// Flush buffered events (e.g. before manual unload)
WatchlogRUM.flush(true)
```

**Note**: When using manual API, you need to manually track route changes:

```jsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import WatchlogRUM from 'watchlog-react-rum'

function MyComponent() {
  const location = useLocation()
  
  useEffect(() => {
    // Manually track page views
    WatchlogRUM.bufferEvent({
      type: 'page_view',
      path: location.pathname,
      normalizedPath: location.pathname, // or compute normalized path
      navType: 'navigate'
    })
  }, [location.pathname])
  
  return <div>...</div>
}
```

---

## ⚠️ Sample Rate Limits & Best Practices

### Session Sample Rate (`sampleRate`)
To protect server resources and prevent overload, the maximum allowed `sampleRate` is **0.5 (50%)**. If you set a value higher than 0.5, it will be automatically capped to 0.5.

**Recommended values:**
- **Development/Testing**: `0.5` (50%) - Full visibility for debugging
- **Production (Low Traffic)**: `0.3` (30%) - Good balance between data and performance
- **Production (High Traffic)**: `0.1` (10%) - Efficient data collection without server strain

**Why limit sample rate?**
High sample rates can generate massive amounts of data, leading to:
- Server overload and potential crashes
- Increased storage costs
- Slower query performance
- Network bandwidth issues

### Network Sample Rate (`networkSampleRate`)
Network requests can be very frequent. We recommend keeping this at **0.1 (10%)** or lower for production environments.

### Interaction Sample Rate (`interactionSampleRate`)
User interactions (clicks, scrolls) can be extremely frequent. We recommend **0.1 (10%)** or lower for production.

---

## 📦 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **required** | Your Watchlog API key |
| `endpoint` | `string` | **required** | RUM endpoint URL |
| `app` | `string` | **required** | Application name |
| `environment` | `string` | `'prod'` | Environment (e.g., 'production', 'staging') |
| `release` | `string` | `null` | Release version (e.g., '1.0.0') |
| `debug` | `boolean` | `false` | Enable debug logging |
| `flushInterval` | `number` | `10000` | Flush interval in milliseconds |
| `sampleRate` | `number` | `1.0` | Session sampling rate (0.0 to 1.0). **Note:** Maximum allowed value is 0.5 (50%) to prevent server overload. Values above 0.5 will be automatically capped. |
| `networkSampleRate` | `number` | `0.1` | Network request sampling rate (0.0 to 1.0). Recommended: 0.1 (10%) for production. |
| `interactionSampleRate` | `number` | `0.1` | User interaction sampling rate (0.0 to 1.0). Recommended: 0.1 (10%) for production. |
| `enableWebVitals` | `boolean` | `true` | Enable Web Vitals tracking (requires web-vitals package) |
| `autoTrackInitialView` | `boolean` | `true` | Automatically track initial page view |
| `captureLongTasks` | `boolean` | `true` | Capture long tasks (>50ms) |
| `captureFetch` | `boolean` | `true` | Capture fetch requests |
| `captureXHR` | `boolean` | `true` | Capture XMLHttpRequest |
| `captureUserInteractions` | `boolean` | `false` | Capture user interactions (clicks, scrolls, forms) |
| `captureBreadcrumbs` | `boolean` | `true` | Capture event breadcrumbs |
| `maxBreadcrumbs` | `number` | `100` | Maximum number of breadcrumbs to keep |
| `beforeSend` | `function` | `(ev) => ev` | Filter/modify events before sending (return null to drop) |

---

## 📦 Exports

| Module | Description |
|--------|-------------|
| `import WatchlogRUM from 'watchlog-react-rum'` | Core SDK: `init`, `bufferEvent`, `custom`, `captureError`, `addBreadcrumb`, `flush` |
| `import { useWatchlogRUM } from 'watchlog-react-rum'` | React hook for SPA auto-tracking |

---

## 🎯 Event Types

### `session_start`
Emitted when a new session begins.

```js
{
  type: 'session_start',
  data: {
    name: 'session_start',
    referrer: 'https://example.com'
  },
  context: { /* full context */ }
}
```

### `page_view`
Emitted on every route change.

```js
{
  type: 'page_view',
  data: {
    name: 'page_view',
    navType: 'navigate'
  },
  context: { /* full context */ }
}
```

### `performance`
Emitted on each page load with navigation and paint metrics.

```js
{
  type: 'performance',
  data: {
    name: 'performance',
    metrics: {
      ttfb: 120,
      domLoad: 450,
      load: 1200,
      domInteractive: 300,
      domComplete: 1100
    },
    navigation: {
      redirect: 0,
      dns: 10,
      tcp: 20,
      request: 30,
      response: 50,
      processing: 800,
      load: 100
    },
    paint: {
      fp: 800,
      fcp: 850
    }
  }
}
```

### `web_vital`
Emitted for Web Vitals metrics (CLS, LCP, INP, TTFB, FID, FCP, FP).

```js
{
  type: 'web_vital',
  data: {
    name: 'LCP',
    value: 1200,
    rating: 'good',
    id: 'metric-id',
    delta: 50
  }
}
```

### `error`
Emitted for JavaScript errors, promise rejections, and React component errors.

```js
{
  type: 'error',
  data: {
    name: 'window_error',
    message: 'Error message',
    stack: 'Error stack trace...',
    source: 'https://example.com/app.js',
    filename: 'app.js',
    lineno: 42,
    colno: 10,
    component: 'MyComponent', // React component errors only
    props: { userId: 123 } // React component errors only
  }
}
```

### `network`
Emitted for fetch/XHR requests (sampled).

```js
{
  type: 'network',
  data: {
    method: 'POST',
    url: 'https://api.example.com/users',
    status: 200,
    ok: true,
    duration: 150,
    requestSize: 1024,
    responseSize: 2048,
    transferSize: 2500,
    encodedBodySize: 2000,
    decodedBodySize: 2048,
    timing: {
      dns: 10,
      tcp: 20,
      request: 30,
      response: 50,
      total: 150
    }
  }
}
```

### `resource`
Emitted for resource loads (images, scripts, stylesheets, etc.).

```js
{
  type: 'resource',
  data: {
    name: 'https://example.com/image.jpg',
    initiator: 'img',
    duration: 200,
    transferSize: 50000,
    encodedBodySize: 48000,
    decodedBodySize: 50000,
    renderBlockingStatus: 'non-blocking'
  }
}
```

### `longtask`
Emitted when JavaScript blocks the main thread for >50ms.

```js
{
  type: 'longtask',
  data: {
    duration: 120,
    startTime: 5000
  }
}
```

### `interaction`
Emitted for user interactions (if enabled, sampled).

```js
{
  type: 'interaction',
  data: {
    type: 'click', // 'click', 'scroll', 'submit', 'input'
    target: 'button',
    value: 'submit-btn'
  }
}
```

### `custom`
Emitted for custom events.

```js
{
  type: 'custom',
  data: {
    name: 'button_clicked',
    value: 1,
    extra: { buttonId: 'submit' }
  }
}
```

---

## 🔍 Context Data

Every event includes rich context information:

```js
{
  context: {
    apiKey: 'your-api-key',
    app: 'your-app',
    sessionId: 'sess-abc123',
    deviceId: 'dev-xyz789',
    environment: 'production',
    release: '1.0.0',
    page: {
      url: 'https://example.com/users/123',
      path: '/users/123',
      normalizedPath: '/users/:id',
      referrer: 'https://google.com',
      title: 'User Profile'
    },
    client: {
      userAgent: 'Mozilla/5.0...',
      language: 'en-US',
      languages: ['en-US', 'en'],
      platform: 'MacIntel',
      cookieEnabled: true,
      onLine: true,
      timezone: 'America/New_York',
      timezoneOffset: 300,
      viewport: {
        width: 1920,
        height: 1080,
        devicePixelRatio: 2
      },
      screen: {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        colorDepth: 24,
        pixelDepth: 24
      },
      connection: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false
      },
      memory: {
        deviceMemory: 8,
        hardwareConcurrency: 8
      },
      browser: {
        name: 'Chrome',
        version: '120'
      },
      os: {
        name: 'macOS',
        version: '14.0'
      },
      colorScheme: 'dark'
    },
    breadcrumbs: [
      {
        category: 'navigation',
        message: 'Navigated to /users/:id',
        level: 'info',
        timestamp: 1234567890
      },
      // ... more breadcrumbs
    ]
  }
}
```

---

## 🔗 Learn more

📘 Full product documentation: [https://watchlog.io/products/rum](https://watchlog.io/products/rum)

Made with ❤️ by the **Watchlog** team | [watchlog.io](https://watchlog.io)
