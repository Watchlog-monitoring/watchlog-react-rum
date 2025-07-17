let buffer = []
let meta = {}
let flushedOnExit = false
let currentNormalizedPath = window.location.pathname
let sentPageView = false // ✅ جلوگیری از تکرار

const WatchlogRUM = {
  init(config) {
    if (!config.apiKey || !config.endpoint) {
      console.warn('[Watchlog RUM] apiKey و endpoint الزامی‌اند.')
      return
    }

    meta = {
      sessionId: generateSessionId(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      apiKey: config.apiKey
    }

    window.__watchlog_startTime = Date.now()

    window.addEventListener('beforeunload', () => {
      if (!flushedOnExit) {
        flushedOnExit = true
        this.bufferEvent({
          type: 'session_end',
          path: window.location.pathname,
          duration: Math.round((Date.now() - window.__watchlog_startTime) / 1000)
        })
        this.flush(true)
      }
    })

    // document.addEventListener('visibilitychange', () => {
    //   if (document.visibilityState === 'hidden' && !flushedOnExit) {
    //     flushedOnExit = true
    //     this.bufferEvent({
    //       type: 'session_end',
    //       path: window.location.pathname,
    //       duration: Math.round((Date.now() - window.__watchlog_startTime) / 1000)
    //     })
    //     this.flush(true)
    //   }
    // })

    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-watchlog]')
      if (target) {
        this.bufferEvent({
          type: 'interaction',
          event: 'click',
          label: target.getAttribute('data-watchlog')
        })
      }
    })

    const pushState = history.pushState
    history.pushState = function () {
      pushState.apply(this, arguments)
      window.dispatchEvent(new Event('locationchange'))
    }
    window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')))

    setInterval(() => this.flush(), config.flushInterval || 10000)
    this.debug = config.debug
    this.endpoint = config.endpoint
  },

  setNormalizedPath(path) {
    currentNormalizedPath = path
  },

  bufferEvent(event) {
    buffer.push({
      ...meta,
      ...event,
      normalizedPath: currentNormalizedPath,
      timestamp: Date.now()
    })

    if (this.debug) console.log('[Watchlog RUM] Buffered:', event)
    if (buffer.length >= 10) this.flush()
  },

  custom(metric, value = 1) {
    if (typeof metric !== 'string') return
    this.bufferEvent({ type: 'custom', metric, value })
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