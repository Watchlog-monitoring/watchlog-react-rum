// React Router v6 wrapper for watchlog-react-rum
// This module wraps React Router functions to track route definitions
// Similar to @datadog/browser-rum-react/react-router-v6

import {
  createBrowserRouter as createBrowserRouterOriginal,
  createHashRouter as createHashRouterOriginal,
  createMemoryRouter as createMemoryRouterOriginal,
} from 'react-router-dom'

// Store route definitions globally so computeNormalizedPath can access them
// We use both a module-level variable and window object for maximum compatibility
let _routeDefinitions = null

// Store in window object for cross-module access (when using bundled code)
if (typeof window !== 'undefined') {
  window.__watchlog_rum_route_definitions__ = null
}

export function getRouteDefinitions() {
  return _routeDefinitions || (typeof window !== 'undefined' ? window.__watchlog_rum_route_definitions__ : null)
}

export function setRouteDefinitions(routes) {
  _routeDefinitions = routes
  if (typeof window !== 'undefined') {
    window.__watchlog_rum_route_definitions__ = routes
  }
}

// Wrapped createBrowserRouter - stores route definitions for route pattern extraction
export function createBrowserRouter(routes, opts) {
  setRouteDefinitions(routes)
  return createBrowserRouterOriginal(routes, opts)
}

// Wrapped createHashRouter
export function createHashRouter(routes, opts) {
  setRouteDefinitions(routes)
  return createHashRouterOriginal(routes, opts)
}

// Wrapped createMemoryRouter
export function createMemoryRouter(routes, opts) {
  setRouteDefinitions(routes)
  return createMemoryRouterOriginal(routes, opts)
}

// Re-export RouterProvider and other components
export {
  RouterProvider,
  useRoutes,
  useNavigate,
  useLocation,
  useParams,
  useMatches,
  matchRoutes,
  createRoutesFromElements,
  createRoutesFromChildren,
} from 'react-router-dom'

