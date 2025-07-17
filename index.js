let buffer = []
let meta = {}
let flushedOnExit = false
let currentNormalizedPath = window.location.pathname
let sentPageView = false
let recentErrors = new Set()

const WatchlogRUM = {
  init(config) {
    if (!config.apiKey || !config.endpoint || !config.app) {
      console.warn('[Watchlog RUM] apiKey، endpoint و app الزامی هستند.')
      return
    }

    meta = {
      sessionId: generateSessionId(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      apiKey: config.apiKey,
      app: config.app
    }

    this.debug = config.debug || false
    this.endpoint = config.endpoint
    this.flushInterval = config.flushInterval || 10000

    setInterval(() => this.flush(), this.flushInterval)
  },

  setNormalizedPath(path) {
    currentNormalizedPath = path
    if (this.debug) console.log('[Watchlog RUM] Normalized path set:', path)
  },

  bufferEvent(event) {
    const fullEvent = {
      ...meta,
      ...event,
      normalizedPath: event.normalizedPath || currentNormalizedPath,
      timestamp: Date.now()
    }

    if (event.type === 'error') {
      const key = `${event.event}:${event.label}`
      if (recentErrors.has(key)) return
      recentErrors.add(key)
      setTimeout(() => recentErrors.delete(key), 3000)
    }

    buffer.push(fullEvent)

    if (this.debug) console.log('[Watchlog RUM] Buffered:', fullEvent)
    if (buffer.length >= 10) this.flush()
  },

  custom(metric, value = 1) {
    if (typeof metric !== 'string') return
    this.bufferEvent({
      type: 'custom',
      metric,
      value
    })
  },

  flush(sync = false) {
    if (buffer.length === 0) return

    const events = [...buffer]
    buffer = []

    const payload = JSON.stringify(events)

    try {
      if (sync && navigator.sendBeacon) {
        navigator.sendBeacon(this.endpoint, payload)
      } else if (sync) {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', this.endpoint, false)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(payload)
      } else {
        fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        })
      }
    } catch (err) {
      if (this.debug) console.warn('[Watchlog RUM] flush error:', err)
    }
  }
}

function generateSessionId() {
  return 'sess-' + Math.random().toString(36).substring(2, 10)
}

export default WatchlogRUM
