// Jest setup file
require('@testing-library/jest-dom');

// Mock canvas
if (typeof window !== 'undefined') {
  if (!window.HTMLCanvasElement.prototype.getContext) {
    window.HTMLCanvasElement.prototype.getContext = function() {
      return {
        fillRect() {},
        clearRect() {},
        getImageData(x, y, w, h) {
          return {
            data: new Array(w * h * 4)
          };
        },
        putImageData() {},
        createImageData() {
          return [];
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
          return { width: 0 };
        },
        transform() {},
        rect() {},
        clip() {},
      };
    };
  }

  // Mock ResizeObserver
  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // Mock WebGL context
  if (!window.WebGLRenderingContext) {
    window.WebGLRenderingContext = function() {};
  }

  // Mock requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      return setTimeout(callback, 0);
    };
  }

  // Mock cancelAnimationFrame
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }

  // Mock URL methods
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => 'mock-url';
  }
  
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {};
  }
} 