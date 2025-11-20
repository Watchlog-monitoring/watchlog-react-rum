# [1.2.0](https://github.com/Watchlog-monitoring/watchlog-react-rum/compare/1.1.4...1.2.0) (2025-11-20)


### Bug Fixes

* react router v6 ([c8a7cc7](https://github.com/Watchlog-monitoring/watchlog-react-rum/commit/c8a7cc71b601b14e795ff335ce1a2af39281e699))


### Features

* react router v6 handle and update usage ([03b34c5](https://github.com/Watchlog-monitoring/watchlog-react-rum/commit/03b34c5456a6c9baee8345d3c8da7e0c52176b33))

# Changelog

All notable changes to `watchlog-react-rum` will be documented in this file.

## [0.3.0] - 2024-12-XX

### Added
- **Comprehensive RUM SDK**: Complete rewrite to match `watchlog-vue-rum` v0.3.0 capabilities
- **Enhanced Context Collection**: Full device info, browser/OS detection, connection info, memory info, color scheme
- **Breadcrumbs System**: Automatic event breadcrumbs for debugging (configurable, max 100)
- **Network Tracking**: Automatic fetch/XHR interception with detailed timing and size information
- **Web Vitals**: Full support for CLS, LCP, INP, TTFB, FID (via web-vitals package)
- **Long Tasks Detection**: Track JavaScript tasks >50ms blocking the main thread
- **Resource Timing**: Track all resource loads (images, scripts, stylesheets) with detailed metrics
- **User Interaction Tracking**: Click, scroll, and form submission tracking (sampled)
- **Enhanced Performance Capture**: Complete navigation timing breakdown (DNS, TCP, request, response, processing, load)
- **Paint Metrics**: First Paint (FP) and First Contentful Paint (FCP) tracking
- **Error Context**: React component name and props in error context
- **Sample Rate Cap**: Maximum `sampleRate` of 0.5 (50%) to prevent server overload
- **Normalized Routes**: Automatic route normalization (e.g., `/users/123` → `/users/:id`)

### Changed
- **SDK Version**: Updated to `0.3.0` to match Vue RUM SDK
- **SDK Name**: Changed from `watchlog-rum-react` to `watchlog-rum-react` in wrapper payload
- **Buffer Size**: Increased from 10 to 50 events
- **Error Deduplication**: Increased window from 3s to 5s
- **Event Format**: Complete alignment with Vue RUM SDK event structure
- **Context Structure**: Full alignment with Vue RUM SDK context format

### Fixed
- **Route Normalization**: Improved React Router v6 route pattern matching
- **Session/Device IDs**: Proper generation and persistence in localStorage
- **Error Handling**: Enhanced error capture with React component context

### Breaking Changes
- **API Changes**: Complete rewrite - see README for new usage
- **Hook API**: `useWatchlogRUM` now requires React Router v6 (`useLocation`, `useMatches`, `useParams`)
- **Event Structure**: Event format changed to match Vue RUM SDK (backward incompatible)

## [1.1.5] - Previous Version

Initial React RUM SDK implementation (basic features only).
