// Vitest setup file (ESM)
import { cleanup } from '@testing-library/react'

// Auto-cleanup between tests (RTL cannot detect vitest's global afterEach)
afterEach(() => {
  cleanup()
})

// NOTE: negative-path tests (components rendered outside <Map>, changed source
// ids, …) deliberately throw during render; React re-dispatches each throw and
// jsdom prints it to raw stderr. These ~16 "Error:" lines are expected test
// fixtures, not failures — they cannot be intercepted (jsdom's virtual console
// binds the raw worker console before any setup code runs).

// Mock canvas
if (typeof window !== 'undefined') {
  if (!window.HTMLCanvasElement.prototype.getContext) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      return {
        fillRect() {},
        clearRect() {},
        getImageData(x, y, w, h) {
          return {
            data: new Array(w * h * 4),
          }
        },
        putImageData() {},
        createImageData() {
          return []
        },
        setTransform() {},
        drawImage() {},
        save() {},
        fillText() {},
        restore() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        closePath() {},
        stroke() {},
        translate() {},
        scale() {},
        rotate() {},
        arc() {},
        fill() {},
        measureText() {
          return { width: 0 }
        },
        transform() {},
        rect() {},
        clip() {},
      }
    }
  }

  // Mock ResizeObserver
  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      constructor(callback) {
        this.callback = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }

  // Mock WebGL context
  if (!window.WebGLRenderingContext) {
    window.WebGLRenderingContext = function () {}
  }

  // Mock requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      return setTimeout(callback, 0)
    }
  }

  // Mock cancelAnimationFrame
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id)
    }
  }

  // Mock URL methods
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => 'mock-url'
  }

  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {}
  }
}

// Suppress console warnings and errors during tests to reduce noise
const originalError = console.error
const originalWarn = console.warn

console.error = (...args) => {
  const message = args[0]?.toString() || ''
  // Suppress known React testing warnings that are expected
  if (
    message.includes('Not implemented: HTMLFormElement.prototype.submit') ||
    message.includes('Not implemented: HTMLCanvasElement.prototype.getContext') ||
    message.includes('Consider adding an error boundary') ||
    message.includes('An update to') ||
    message.includes('inside a test was not wrapped in act') ||
    message.includes('Uncaught [Error:')
  ) {
    return
  }
  originalError.call(console, ...args)
}

console.warn = (...args) => {
  const message = args[0]?.toString() || ''
  // Suppress expected warnings from test assertions
  if (
    message.includes('layer type changed') ||
    message.includes('layer id changed') ||
    message.includes('source type changed') ||
    message.includes('source id changed') ||
    message.includes('Unable to update')
  ) {
    return
  }
  originalWarn.call(console, ...args)
}
