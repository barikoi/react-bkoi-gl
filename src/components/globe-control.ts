/**
 * @fileoverview GlobeControl component for switching between 3D globe and 2D map views.
 *
 * Provides a control button to toggle between mercator (2D flat map) and
 * globe (3D) projections in MapLibre GL 3.x+.
 *
 * @module components/globe-control
 * @see {@link https://maplibre.org/maplibre-gl-js/docs/layers/}
 */

import { useEffect, memo, useRef } from 'react'
import { useControl } from './use-control'
import { logger } from '../utils/logger'

import type { ControlPosition, IControl, Map as MapInstance } from '../types/lib'

/**
 * Options for the GlobeControl
 */
export interface GlobeControlOptions {
  /** Custom button element */
  buttonElement?: HTMLElement
  /** Custom button class name */
  buttonClassName?: string
  /** Button title/tooltip text */
  buttonTitle?: string
  /** Custom CSS for the button */
  buttonStyle?: React.CSSProperties
}

export type GlobeControlProps = GlobeControlOptions & {
  /** Position of the control on the map */
  position?: ControlPosition
  /** Called when projection changes */
  onProjectionChange?: (isGlobe: boolean) => void
}

/**
 * Default button SVG icons
 */
const GLOBE_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <line x1="2" y1="12" x2="22" y2="12"/>
  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
</svg>`

const MAP_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
  <line x1="8" y1="2" x2="8" y2="18"/>
  <line x1="16" y1="6" x2="16" y2="22"/>
</svg>`

/**
 * GlobeControlImpl class implementing IControl interface
 */
class GlobeControlImpl implements IControl {
  private _container: HTMLDivElement
  private _button: HTMLButtonElement
  private _map: MapInstance | null = null
  private _isGlobe: boolean = false
  private _options: GlobeControlOptions
  private _onProjectionChange?: (isGlobe: boolean) => void

  constructor(
    options: GlobeControlOptions,
    callbacks: {
      onProjectionChange?: (isGlobe: boolean) => void
    }
  ) {
    this._options = options
    this._onProjectionChange = callbacks.onProjectionChange
    this._container = document.createElement('div')
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
    this._button = this._createButton()
    this._container.appendChild(this._button)
  }

  private _createButton(): HTMLButtonElement {
    let button = this._options.buttonElement as HTMLButtonElement

    if (button) {
      const tagName = button.tagName.toLowerCase()
      const role = button.getAttribute('role')
      const isButton = tagName === 'button' || role === 'button'

      if (!isButton) {
        logger.warn(
          'GlobeControl: Refusing non-button custom element. custom element must be a <button> or have role="button".'
        )
        button = document.createElement('button')
      }
    } else {
      button = document.createElement('button')
    }

    // Unconditionally set / ensure accessibility properties
    const tagName = button.tagName.toLowerCase()
    if (tagName === 'button') {
      if (!button.getAttribute('type')) {
        button.setAttribute('type', 'button')
      }
    } else {
      if (!button.getAttribute('role')) {
        button.setAttribute('role', 'button')
      }
      if (!button.getAttribute('tabindex')) {
        button.setAttribute('tabindex', '0')
      }
    }

    if (!button.getAttribute('aria-label')) {
      button.setAttribute('aria-label', 'Toggle Globe View')
    }
    if (!button.getAttribute('title')) {
      button.setAttribute('title', this._options.buttonTitle || 'Toggle Globe View')
    }

    // For default button (or refused custom buttons), apply styles and SVG content
    if (!this._options.buttonElement || button !== this._options.buttonElement) {
      button.className = this._options.buttonClassName || 'maplibregl-ctrl-globe'
      button.innerHTML = this._isGlobe ? MAP_SVG : GLOBE_SVG

      // Apply custom styles
      Object.assign(button.style, {
        padding: '5px',
        border: 'none',
        background: 'white',
        cursor: 'pointer',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...this._options.buttonStyle,
      })
    }

    button.addEventListener('click', () => this._toggleGlobe())

    return button
  }

  private _toggleGlobe(): void {
    if (!this._map) return

    this._isGlobe = !this._isGlobe

    // Update button icon if it's default
    if (!this._options.buttonElement || this._button !== this._options.buttonElement) {
      this._button.innerHTML = this._isGlobe ? MAP_SVG : GLOBE_SVG
    }

    // Update title and aria-label unconditionally
    const labelText = this._isGlobe ? 'Switch to Map View' : 'Switch to Globe View'
    this._button.setAttribute('aria-label', labelText)
    this._button.title = labelText

    // Set projection
    try {
      const projection = this._isGlobe ? { type: 'globe' } : { type: 'mercator' }
      ;(this._map as any).setProjection(projection)
      this._onProjectionChange?.(this._isGlobe)
    } catch (error) {
      logger.warn('GlobeControl: setProjection not available', error)
    }
  }

  onAdd(map: MapInstance): HTMLElement {
    this._map = map

    // Check if globe projection is available
    try {
      const currentProjection = (map as any).getProjection?.()
      this._isGlobe = currentProjection?.type === 'globe'
      if (!this._options.buttonElement || this._button !== this._options.buttonElement) {
        this._button.innerHTML = this._isGlobe ? MAP_SVG : GLOBE_SVG
      }
      const labelText = this._isGlobe ? 'Switch to Map View' : 'Switch to Globe View'
      this._button.setAttribute('aria-label', labelText)
      this._button.title = labelText
    } catch {
      // Globe projection not available, default to map view
      this._isGlobe = false
    }

    return this._container
  }

  onRemove(): void {
    this._container.parentNode?.removeChild(this._container)
    this._map = null
  }

  /**
   * Check if currently in globe view
   */
  isGlobe(): boolean {
    return this._isGlobe
  }

  /**
   * Set the projection programmatically
   */
  setGlobe(isGlobe: boolean): void {
    if (this._isGlobe !== isGlobe) {
      this._toggleGlobe()
    }
  }
}

/**
 * GlobeControl component for toggling between 3D globe and 2D map views.
 *
 * This control works with MapLibre GL 3.x+ which supports globe projection.
 * Adds a button to the map that toggles between mercator (flat) and globe (3D) projections.
 *
 * @component
 * @example
 * ```tsx
 * import { Map, GlobeControl } from 'react-bkoi-gl';
 * import "react-bkoi-gl/styles";
 *
 * function GlobeExample() {
 *   const handleProjectionChange = (isGlobe) => {
 *     console.log('Globe view:', isGlobe);
 *   };
 *
 *   return (
 *     <Map
 *       mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
 *       initialViewState={{
 *         longitude: 90.3938,
 *         latitude: 23.8216,
 *         zoom: 12
 *       }}
 *     >
 *       <GlobeControl
 *         position="top-right"
 *         onProjectionChange={handleProjectionChange}
 *       />
 *     </Map>
 *   );
 * }
 * ```
 */
function _GlobeControl(props: GlobeControlProps) {
  const { position, onProjectionChange, ...options } = props

  // Store callback in ref to avoid recreating control
  const callbacksRef = useRef({ onProjectionChange })

  // Update callback ref when it changes
  useEffect(() => {
    callbacksRef.current = { onProjectionChange }
  }, [onProjectionChange])

  useControl(
    () => {
      return new GlobeControlImpl(options, {
        onProjectionChange: isGlobe => callbacksRef.current.onProjectionChange?.(isGlobe),
      })
    },
    { position }
  )

  return null
}

export const GlobeControl = memo(_GlobeControl)
