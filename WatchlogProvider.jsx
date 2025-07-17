import { useEffect } from 'react'
import { useLocation, useMatches, useParams } from 'react-router-dom'
import WatchlogRUM from './index.js'

function WatchlogProvider() {
  const location = useLocation()
  const matches = useMatches()
  const params = useParams()
  const path = location.pathname

  // تشخیص دقیق normalizedPath
  let normalizedPath = path
  if (matches.length > 0) {
    let routePath = matches[matches.length - 1]?.route?.path || path
    Object.entries(params).forEach(([k, v]) => {
      routePath = routePath.replace(v, `:${k}`)
    })
    normalizedPath = routePath.startsWith('/') ? routePath : '/' + routePath
  }

  // ⛳ لحظه‌ای normalizedPath رو در window ثبت می‌کنیم
  window.__watchlog_normalizedPath = normalizedPath

  useEffect(() => {
    // مجدد برای اطمینان
    WatchlogRUM.setNormalizedPath(normalizedPath)
    window.__watchlog_startTime = Date.now()

    WatchlogRUM.bufferEvent({ type: 'session_start', path })
    WatchlogRUM.bufferEvent({ type: 'page_view', path })

    const handleError = (e) => {
      WatchlogRUM.bufferEvent({
        type: 'error',
        event: 'window_error',
        label: e.message || 'error',
        stack: e.error?.stack,
        path,
        normalizedPath: window.__watchlog_normalizedPath || path
      })
    }

    const handleRejection = (e) => {
      WatchlogRUM.bufferEvent({
        type: 'error',
        event: 'unhandled_promise',
        label: e.reason?.message || String(e.reason),
        path,
        normalizedPath: window.__watchlog_normalizedPath || path
      })
    }

    const handleUnload = () => {
      WatchlogRUM.bufferEvent({
        type: 'session_end',
        path,
        normalizedPath,
        duration: Math.round((Date.now() - window.__watchlog_startTime) / 1000)
      })
      WatchlogRUM.flush(true)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [path, normalizedPath])

  return null
}

export default WatchlogProvider
