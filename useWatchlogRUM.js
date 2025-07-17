import { useEffect, useRef } from 'react'
import { useLocation, useMatches, useParams } from 'react-router-dom'
import WatchlogRUM from './index.js'

function useWatchlogRUM() {
  const location = useLocation()
  const matches = useMatches()
  const params = useParams()
  const path = location.pathname
  const prevPathRef = useRef(null)
  const sentRef = useRef(false)

  let normalizedPath = path
  if (matches.length > 0) {
    const last = matches[matches.length - 1]
    let routePath = last.route?.path || path
    Object.entries(params).forEach(([key, value]) => {
      routePath = routePath.replace(value, `:${key}`)
    })
    normalizedPath = routePath.startsWith('/') ? routePath : '/' + routePath
  }

  useEffect(() => {
    WatchlogRUM.setNormalizedPath(normalizedPath)
    prevPathRef.current = path
  }, [normalizedPath])
}

export default useWatchlogRUM
