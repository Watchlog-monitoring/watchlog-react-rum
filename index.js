// src/lib/watchlog-rum/index.js
import { useEffect, useRef } from 'react';
import { useLocation, useMatches, useParams } from 'react-router-dom';

// Internal state
let buffer = [];
let meta = {};
let flushTimer;
let sessionStartTime;
let lastPageViewPath = null;
let _recentErrors = new Set();

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

// Capture page performance metrics
function capturePerformance(pathname, normalizedPath) {
  try {
    const timing = window.performance.timing;
    const metrics = {
      ttfb: timing.responseStart - timing.requestStart,
      domLoad: timing.domContentLoadedEventEnd - timing.navigationStart,
      load: timing.loadEventEnd - timing.navigationStart,
    };
    bufferEvent({ type: 'performance', metrics, path: pathname, normalizedPath });
  } catch {
    // ignore
  }
}

// Core SDK methods
function registerListeners(config) {
  const { apiKey, endpoint, app, debug = false, flushInterval = 10000 } = config;
  if (!apiKey || !endpoint || !app) {
    console.warn('[Watchlog RUM] apiKey, endpoint, and app are required.');
    return false;
  }
  const initialNormalizedPath = meta.normalizedPath || window.location.pathname;

  // Initialize meta
  meta = {
    sessionId: 'sess-' + Math.random().toString(36).substring(2, 10),
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    apiKey,
    app,
    normalizedPath: initialNormalizedPath,
  };

  // Assign config
  WatchlogRUM.debug = debug;
  WatchlogRUM.endpoint = endpoint;

  // Register global listeners once
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
    if (_recentErrors.has(key)) return;
    _recentErrors.add(key);
    setTimeout(() => _recentErrors.delete(key), 3000);
  }

  buffer.push({ ...meta, ...event, timestamp: Date.now() });
  if (WatchlogRUM.debug) console.log('[Watchlog RUM] Buffered event:', event);
  if (buffer.length >= 10) flush();
}

function custom(metric, value = 1) {
  if (typeof metric !== 'string') return;
  const path = window.location.pathname;
  const normalizedPath = meta.normalizedPath;
  bufferEvent({ type: 'custom', metric, value, path, normalizedPath });
  flush();
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

// Export core SDK
const WatchlogRUM = {
  init: registerListeners,
  setNormalizedPath: (p) => (meta.normalizedPath = p),
  bufferEvent,
  custom,
  flush,
};

// React hook for SPA tracking
export function useWatchlogRUM(config) {
  const location = useLocation();
  const matches = useMatches();
  const params = useParams();
  const initialized = useRef(false);

  // compute normalizedPath synchronously
  let routePath = matches.length
    ? matches[matches.length - 1]?.route?.path || location.pathname
    : location.pathname;
  Object.entries(params).forEach(([k, v]) => {
    routePath = routePath.replace(v, `:${k}`);
  });
  const normalizedPath = routePath.startsWith('/')
    ? routePath
    : `/${routePath}`;
  // update meta for everything that follows
  meta.normalizedPath = normalizedPath;

  // init SDK once
  useEffect(() => {
    registerListeners(config);
  }, []);

  // page_view & error tracking per route
  useEffect(() => {
    const pathname = location.pathname;

    // first load
    if (!initialized.current) {
      sessionStartTime = Date.now();
      bufferEvent({ type: 'session_start', path: pathname, normalizedPath });
      bufferEvent({ type: 'page_view', path: pathname, normalizedPath });
      capturePerformance(pathname, normalizedPath);
      initialized.current = true;
      lastPageViewPath = normalizedPath;
      return;
    }

    // on route change
    if (normalizedPath !== lastPageViewPath) {
      bufferEvent({ type: 'page_view', path: pathname, normalizedPath });
      capturePerformance(pathname, normalizedPath);
      lastPageViewPath = normalizedPath;
    }

    // **per-route error handlers****
    const handleError = (e) => {
      console.log(normalizedPath)
      bufferEvent({
        type: 'error',
        event: 'window_error',
        label: e.message || 'error',
        stack: e.error?.stack,
        path: pathname,
        normalizedPath,
      });
    };
    const handleRejection = (e) => {
      bufferEvent({
        type: 'error',
        event: 'unhandled_promise',
        label: e.reason?.message || String(e.reason),
        path: pathname,
        normalizedPath,
      });
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [location.pathname]);
}

export default WatchlogRUM;