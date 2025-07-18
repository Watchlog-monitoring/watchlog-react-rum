// watchlog-rum/index.js
import { useEffect, useRef } from 'react';
import { useLocation, useMatches, useParams } from 'react-router-dom';

// Internal state
let buffer = [];
let meta = {};
let flushTimer;
let sessionStartTime;
let sessionStarted = false;
let lastPageViewPath = null;
let lastPageViewTime = 0;

// Global error handlers
function onErrorGlobal(e) {
  bufferEvent({
    type: 'error',
    event: 'window_error',
    label: e.message || 'error',
    stack: e.error?.stack,
    path: window.location.pathname,
    normalizedPath: meta.normalizedPath,
  });
}

function onRejectionGlobal(e) {
  bufferEvent({
    type: 'error',
    event: 'unhandled_promise',
    label: e.reason?.message || String(e.reason),
    path: window.location.pathname,
    normalizedPath: meta.normalizedPath,
  });
}

function registerListeners(config) {
  const { apiKey, endpoint, app, debug = false, flushInterval = 10000 } = config;
  if (!apiKey || !endpoint || !app) {
    console.warn('[Watchlog RUM] apiKey, endpoint, and app are required.');
    return false;
  }

  // Initialize meta
  meta = {
    sessionId: 'sess-' + Math.random().toString(36).substring(2, 10),
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    apiKey,
    app,
    normalizedPath: '',
  };

  // Assign config
  WatchlogRUM.debug = debug;
  WatchlogRUM.endpoint = endpoint;
  WatchlogRUM.flushInterval = flushInterval;

  // Register global listeners only once
  if (!window.__watchlog_listeners_registered) {
    window.addEventListener('error', onErrorGlobal);
    window.addEventListener('unhandledrejection', onRejectionGlobal);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.__watchlog_listeners_registered = true;
  }

  // Setup flush interval
  clearInterval(flushTimer);
  flushTimer = setInterval(() => flush(), flushInterval);

  return true;
}

function handleBeforeUnload() {
  const duration = sessionStartTime
    ? Math.round((Date.now() - sessionStartTime) / 1000)
    : null;
  bufferEvent({
    type: 'session_end',
    path: window.location.pathname,
    normalizedPath: meta.normalizedPath,
    duration,
  });
  flush(true);
  clearInterval(flushTimer);
}

function bufferEvent(event) {
  if (event.type === 'error') {
    const key = `${event.event}:${event.label}`;
    if (!WatchlogRUM._recentErrors) WatchlogRUM._recentErrors = new Set();
    if (WatchlogRUM._recentErrors.has(key)) return;
    WatchlogRUM._recentErrors.add(key);
    setTimeout(() => WatchlogRUM._recentErrors.delete(key), 3000);
  }

  buffer.push({ ...meta, ...event, timestamp: Date.now() });
  if (WatchlogRUM.debug) console.log('[Watchlog RUM] Buffered event:', event);
  if (buffer.length >= 10) flush();
}

function custom(metric, value = 1) {
  if (typeof metric !== 'string') return;
  bufferEvent({ type: 'custom', metric, value });
}

function flush(sync = false) {
  if (!buffer.length) return;
  const events = buffer.splice(0, buffer.length);
  const payload = JSON.stringify(events);
  try {
    if (sync && navigator.sendBeacon) {
      navigator.sendBeacon(WatchlogRUM.endpoint, payload);
    } else if (sync) {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', WatchlogRUM.endpoint, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    } else {
      fetch(WatchlogRUM.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
    }
  } catch (err) {
    if (WatchlogRUM.debug) console.warn('[Watchlog RUM] Flush error:', err);
  }
}

const WatchlogRUM = { init: registerListeners, setNormalizedPath: (p) => (meta.normalizedPath = p), bufferEvent, custom, flush };

export function useWatchlogRUM(config) {
  const location = useLocation();
  const matches = useMatches();
  const params = useParams();
  const initialized = useRef(false);

  // Register listeners once
  useEffect(() => {
    registerListeners(config);
  }, []);

  // Handle initial load and route changes
  useEffect(() => {
    const pathname = location.pathname;

    // Compute normalized path
    let routePath = matches.length ? matches[matches.length - 1]?.route?.path || pathname : pathname;
    Object.entries(params).forEach(([key, value]) => {
      routePath = routePath.replace(value, `:${key}`);
    });
    const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;

    // Update meta normalizedPath
    meta.normalizedPath = normalizedPath;

    // Session start & first page_view on initial load
    if (!initialized.current) {
      sessionStarted = true;
      sessionStartTime = Date.now();
      bufferEvent({ type: 'session_start', path: pathname, normalizedPath });
      bufferEvent({ type: 'page_view', path: pathname, normalizedPath });
      if (WatchlogRUM.debug) console.log('[Watchlog RUM] Session started & page_view:', meta.sessionId);
      initialized.current = true;
      lastPageViewPath = normalizedPath;
      lastPageViewTime = Date.now();
      return;
    }

    // Page view only if route changed
    if (normalizedPath !== lastPageViewPath) {
      bufferEvent({ type: 'page_view', path: pathname, normalizedPath });
      lastPageViewPath = normalizedPath;
      lastPageViewTime = Date.now();
    }
  }, [location.pathname]);
}

export default WatchlogRUM;