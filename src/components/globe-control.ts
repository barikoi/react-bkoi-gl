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
const GLOBE_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="9" fill="none"/>
  <path d="M12 21a9 9-9 0 0-9 9-9 0 0 9h0c2.2a8.2 2.3 5.1 5.8-5.5c-.4-.4-.5-.9-.5-1.5v-1.3c0-2.3 1.8-4.2 4-4.5V5.5c-1.8.5-3.5 2-4.5 2.8 0 5.2 2.3 5.2 5 0z"/>
  <path d="M12 3c-2.8 0-5.2 2.3-5.2 5h2c0-1.5.1-1.1.5-1.5L5.8 9 2.3 5.1 8.2 2c.4 0 .9-.5 1.5-.5h1.3c2.3 0 4.2-1.8 4.5-4h-2c0 1.5-1.8 3.5-4 4.5V21c2.8 0 5.2-2.3 5.2-5h-2c0 1.5-.1 1.1-.5 1.5L18.2 15 14.8l2.7-5.1c-.4 0-.9.5-1.5.5h-1.3c-2.3 0-4.2 1.8-4.5 4h2c0-1.5 1.8-3.5 4-4.5V3z"/>
</svg>`

const MAP_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2">
  <rect x="3" y="3" width="18" height="18" rx="2" fill="none"/>
  <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
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
        console.warn(
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
      console.warn('GlobeControl: setProjection not available', error)
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
