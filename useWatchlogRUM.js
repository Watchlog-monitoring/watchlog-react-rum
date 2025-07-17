import { useEffect, useRef } from 'react'
import { useMatches } from 'react-router-dom'
import WatchlogRUM from './index.js'

function useWatchlogRUM() {
  const matches = useMatches()
  const sentRef = useRef(false)
  const prevPathRef = useRef(window.location.pathname)

  let normalized = window.location.pathname

  if (matches.length > 0) {
    const last = matches[matches.length - 1]
    let fullPath = last.pathname

    Object.entries(last.params || {}).forEach(([key, value]) => {
      fullPath = fullPath.replace(value, `:${key}`)
    })

    normalized = fullPath
  }

  useEffect(() => {
    WatchlogRUM.setNormalizedPath(normalized)

    const path = window.location.pathname

    if (!sentRef.current) {
      sentRef.current = true

      WatchlogRUM.bufferEvent({ type: 'session_start', path })

      const nav = performance.getEntriesByType('navigation')[0]
      if (nav && !WatchlogRUM._pageViewSent) {
        WatchlogRUM._pageViewSent = true
        WatchlogRUM.bufferEvent({
          type: 'page_view',
          path,
          ttfb: nav.responseStart,
          domLoad: nav.domContentLoadedEventEnd,
          fullLoad: nav.loadEventEnd
        })
      }
    } else if (prevPathRef.current !== path) {
      WatchlogRUM.bufferEvent({ type: 'route_change', path })
      WatchlogRUM.bufferEvent({ type: 'page_view', path })
    }

    prevPathRef.current = path
  }, [normalized])
}

export default useWatchlogRUM