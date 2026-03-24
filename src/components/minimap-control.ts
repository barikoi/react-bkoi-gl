import * as React from 'react'
import { useEffect, memo } from 'react'
import {
  Map,
  type IControl,
  type GeoJSONSource,
  type ControlPosition,
  type StyleSpecification,
} from 'maplibre-gl'
import { useControl } from './use-control'

type MapLibreMap = Map

/**
 * Map interaction types that can be disabled/enabled
 */
export type MapInteractions =
  | 'dragPan'
  | 'scrollZoom'
  | 'boxZoom'
  | 'dragRotate'
  | 'keyboard'
  | 'doubleClickZoom'
  | 'touchZoomRotate'

/**
 * Configuration for minimap interactions
 */
export type MinimapInteractions = Record<MapInteractions, boolean>

/**
 * Configuration for the parent rectangle overlay
 */
export interface ParentRectConfig {
  /** Layout properties for the line layer */
  lineLayout?: Record<string, unknown>
  /** Paint properties for the line layer */
  linePaint?: Record<string, unknown>
  /** Paint properties for the fill layer */
  fillPaint?: Record<string, unknown>
}

/**
 * Configuration for the toggle button
 */
export interface ToggleButtonConfig {
  /** Custom SVG icon */
  icon?: string
  /** Custom CSS class */
  className?: string
  /** Custom inline styles */
  style?: Record<string, string>
  /** Background color of the icon */
  iconBackgroundColor?: string
  /** Hover color */
  hoverColor?: string
  /** Enable rotation based on position */
  enableRotation?: boolean
  /** Custom rotation angle */
  rotationAngle?: number
}

/**
 * Minimap control options
 */
export interface MinimapControlOptions {
  /** Initial center coordinates */
  center?: [number, number]
  /** Barikoi API access token */
  accessToken?: string
  /** Map style for the minimap */
  style?: string | StyleSpecification
  /** Zoom level difference from parent */
  zoomAdjust?: number
  /** Lock to specific zoom level */
  lockZoom?: number
  /** Sync pitch with parent */
  pitchAdjust?: boolean
  /** Custom container styles */
  containerStyle?: Record<string, string>
  /** Position on map */
  position?: ControlPosition
  /** Parent rectangle configuration */
  parentRect?: ParentRectConfig
  /** Whether minimap can be toggled */
  toggleable?: boolean
  /** Toggle button configuration */
  toggleButton?: ToggleButtonConfig
  /** Start minimized */
  initialMinimized?: boolean
  /** Width when minimized */
  collapsedWidth?: string
  /** Height when minimized */
  collapsedHeight?: string
  /** Border radius */
  borderRadius?: string
  /** Interaction configuration */
  interactions?: Partial<MinimapInteractions>
  /** Toggle callback */
  onToggle?: (isMinimized: boolean) => void
  /** Hide tooltip text */
  hideText?: string
  /** Show tooltip text */
  showText?: string
  /** Enable responsive sizing */
  responsive?: boolean
  /** Responsive width */
  responsiveWidth?: string
  /** Responsive height */
  responsiveHeight?: string
  /** Minimum width */
  minWidth?: string
  /** Minimum height */
  minHeight?: string
  /** Maximum width */
  maxWidth?: string
  /** Maximum height */
  maxHeight?: string
}

export type MinimapControlProps = MinimapControlOptions & {
  /** CSS style override */
  style?: React.CSSProperties
}

/**
 * Default interactions (all disabled)
 */
const defaultInteractions: MinimapInteractions = {
  dragPan: false,
  scrollZoom: false,
  boxZoom: false,
  dragRotate: false,
  keyboard: false,
  doubleClickZoom: false,
  touchZoomRotate: false,
}

/**
 * Default SVG icon for toggle button
 */
const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.6 18L8 8.4V17H6V5h12v2H9.4l9.6 9.6l-1.4 1.4Z" /></svg>`

/**
 * Generate a random UUID using crypto API
 */
function getRandomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const array = new Uint8Array(1)
    crypto.getRandomValues(array)
    const r = array[0] % 16
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Sanitize SVG string to prevent XSS attacks
 */
function sanitizeSVG(svgString: string): string {
  // Only allow valid SVG structure
  const svgPattern = /^<svg[^>]*>[\s\S]*<\/svg>$/i
  if (!svgPattern.test(svgString)) {
    console.warn('Invalid SVG format, using default icon')
    return DEFAULT_ICON
  }

  // Remove potentially dangerous elements and attributes
  return svgString
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

/**
 * Internal minimap options
 */
interface InternalMinimapOptions extends MinimapControlOptions {
  container?: HTMLElement
  zoom?: number
  minZoom?: number
  maxZoom?: number
  bearing?: number
  pitch?: number
  attributionControl: boolean
  logoPosition?: string
}

/**
 * Minimap class - wraps MapLibre Map as a control
 */
class Minimap implements IControl {
  private options: InternalMinimapOptions
  private map!: MapLibreMap
  private parentMap!: MapLibreMap
  private container!: HTMLElement
  private readonly id: string
  private parentRect?: GeoJSON.Feature<GeoJSON.Polygon>
  private differentStyle = false
  private desync?: () => void
  private toggleButtonCleanup?: () => void
  private isMinimized = false
  private resizeHandler?: () => void

  constructor(options: MinimapControlOptions = {}) {
    this.id = `minimap-${getRandomUUID()}`

    if (options.style !== undefined) {
      this.differentStyle = true
    }

    const interactions = { ...defaultInteractions, ...(options.interactions ?? {}) }

    const containerStyle = this.validateContainerStyle(options.containerStyle)

    this.options = {
      zoomAdjust: -4,
      position: 'top-right',
      pitchAdjust: false,
      attributionControl: false,
      logoPosition: 'bottom-left',
      toggleable: true,
      initialMinimized: false,
      collapsedWidth: '29px',
      collapsedHeight: '29px',
      borderRadius: '3px',
      hideText: 'Hide minimap',
      showText: 'Show minimap',
      responsive: true,
      responsiveWidth: '20vw',
      responsiveHeight: '20vh',
      minWidth: '200px',
      minHeight: '150px',
      maxWidth: '400px',
      maxHeight: '300px',
      interactions,
      ...options,
      containerStyle,
    } as InternalMinimapOptions

    if (options.lockZoom !== undefined) {
      this.options.minZoom = options.lockZoom
      this.options.maxZoom = options.lockZoom
    }

    this.isMinimized = this.options.initialMinimized ?? false
  }

  onAdd(parentMap: MapLibreMap): HTMLElement {
    this.parentMap = parentMap

    this.container = this.createContainer()

    this.options.container = this.container
    this.options.zoom = parentMap.getZoom() + (this.options.zoomAdjust ?? -4)
    this.options.center ??= parentMap.getCenter().toArray() as [number, number]
    this.options.bearing = parentMap.getBearing()
    this.options.pitch = this.options.pitchAdjust ? parentMap.getPitch() : 0

    if (!this.differentStyle) {
      this.options.style = parentMap.getStyle()
    }

    this.map = new Map(this.options as unknown as ConstructorParameters<typeof Map>[0])

    this.map.once('style.load', () => {
      this.map.resize()
    })

    this.map.once('load', () => {
      this.configureInteractions()
      this.addParentRect(this.options.parentRect)
      this.desync = this.syncMaps()
      this.setupToggleButton()
      this.setupResponsiveSizing()
    })

    return this.container
  }

  onRemove(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = undefined
    }
    this.toggleButtonCleanup?.()
    this.desync?.()
    this.container.remove()
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = this.id
    container.className =
      'maplibregl-ctrl maplibregl-ctrl-group maplibregl-ctrl-minimap custom-ctrl-minimap'

    if (this.isMinimized) {
      container.classList.add('minimized')
    }

    const styleEl = document.createElement('style')
    styleEl.innerHTML = this.getContainerStyles()
    container.appendChild(styleEl)

    if (this.options.containerStyle) {
      for (const [key, value] of Object.entries(this.options.containerStyle)) {
        container.style.setProperty(key, value)
      }
    }

    if (this.isMinimized) {
      container.style.width = this.options.collapsedWidth || '29px'
      container.style.height = this.options.collapsedHeight || '29px'
    }

    const preventDefault = (e: Event) => e.preventDefault()
    container.addEventListener('contextmenu', preventDefault)

    return container
  }

  private getContainerStyles(): string {
    const width = this.options.containerStyle?.width || '400px'
    const height = this.options.containerStyle?.height || '300px'
    const collapsedWidth = this.options.collapsedWidth || '29px'
    const collapsedHeight = this.options.collapsedHeight || '29px'
    const borderRadius = this.options.borderRadius || '3px'

    return `
      #${this.id}.custom-ctrl-minimap {
        cursor: default !important;
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.65);
        transition: width 0.6s ease-in, height 0.6s ease-in, border-color 0s ease-in;
        border-style: solid;
        border-radius: ${borderRadius};
        border-width: 4px;
        border-color: white;
        width: ${width};
        height: ${height};
        overflow: hidden;
        background: #fff;
        position: relative;
      }
      #${this.id}.minimized {
        border-radius: 3px !important;
        width: ${collapsedWidth};
        height: ${collapsedHeight};
      }
      #${this.id} canvas {
        width: 100% !important;
        height: 100% !important;
        display: block;
      }
      @media (prefers-color-scheme: dark) {
        #${this.id}.custom-ctrl-minimap {
          border-color: hsl(0, 0%, 15.2%);
        }
      }
    `
  }

  private validateContainerStyle(style?: Record<string, string>): Record<string, string> {
    const defaults = { border: '1px solid #000', width: '400px', height: '300px' }
    if (!style) return defaults

    const validated: Record<string, string> = {}
    if (style.width) {
      validated.width = CSS.supports('width', style.width) ? style.width : defaults.width
    } else {
      validated.width = defaults.width
    }
    if (style.height) {
      validated.height = CSS.supports('height', style.height) ? style.height : defaults.height
    } else {
      validated.height = defaults.height
    }
    for (const [key, value] of Object.entries(style)) {
      if (key !== 'width' && key !== 'height') {
        validated[key] = value
      }
    }
    return validated
  }

  private configureInteractions(): void {
    const interactions = this.options.interactions || defaultInteractions
    for (const [interaction, enabled] of Object.entries(interactions)) {
      if (!enabled) {
        const interactionMethod = interaction as keyof MinimapInteractions
        const interactionObj = this.map[interactionMethod] as { disable: () => void } | undefined
        interactionObj?.disable()
      }
    }
  }

  private setupToggleButton(): void {
    if (!this.options.toggleable) return

    const el = document.createElement('button')
    const elId = 'btn-' + getRandomUUID()

    el.innerHTML = sanitizeSVG(this.options.toggleButton?.icon || DEFAULT_ICON)
    el.setAttribute('id', elId)
    el.setAttribute('type', 'button')
    el.setAttribute('aria-label', this.options.hideText || 'Hide minimap')
    el.setAttribute('title', this.options.hideText || 'Hide minimap')

    if (this.options.toggleButton?.className) {
      const classes = this.options.toggleButton.className.split(' ')
      classes.forEach(cls => el.classList.add(cls))
    }

    const iconBackgroundColor = this.options.toggleButton?.iconBackgroundColor || 'black'
    const hoverColor = this.options.toggleButton?.hoverColor || '#e5e7e3'

    const styleEl = document.createElement('style')
    styleEl.innerHTML = `
      button#${elId} {
        border-radius: 0 !important;
        color: black;
        background-color: ${iconBackgroundColor};
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease-in;
        position: absolute;
        width: 24px;
        height: 24px;
        z-index: 2;
        padding: 0;
        left: 0;
        top: 0;
      }
      button#${elId}:hover {
        background-color: ${hoverColor} !important;
      }
      button#${elId} svg {
        fill: white;
        width: 16px;
        height: 16px;
      }
      .minimized > button#${elId} > * {
        transform: rotate(-180deg);
      }
    `

    const clickHandler = () => {
      this.toggle()
      const minimized = this.container.classList.contains('minimized')
      const text = minimized
        ? this.options.showText || 'Show minimap'
        : this.options.hideText || 'Hide minimap'
      el.setAttribute('aria-label', text)
      el.setAttribute('title', text)
    }

    el.addEventListener('click', clickHandler)
    document.head.appendChild(styleEl)
    this.container.appendChild(el)

    this.toggleButtonCleanup = () => {
      el.removeEventListener('click', clickHandler)
      styleEl.remove()
      this.container.removeChild(el)
    }
  }

  private setupResponsiveSizing(): void {
    if (!this.options.responsive) return

    const updateSize = () => {
      if (this.isMinimized) return

      const vw = window.innerWidth / 100
      const vh = window.innerHeight / 100

      const responsiveWidth = this.options.responsiveWidth || '20vw'
      const responsiveHeight = this.options.responsiveHeight || '20vh'

      let width: number
      let height: number

      if (responsiveWidth.endsWith('vw')) {
        width = parseFloat(responsiveWidth) * vw
      } else if (responsiveWidth.endsWith('%')) {
        width = (parseFloat(responsiveWidth) / 100) * window.innerWidth
      } else {
        width = parseFloat(responsiveWidth)
      }

      if (responsiveHeight.endsWith('vh')) {
        height = parseFloat(responsiveHeight) * vh
      } else if (responsiveHeight.endsWith('%')) {
        height = (parseFloat(responsiveHeight) / 100) * window.innerHeight
      } else {
        height = parseFloat(responsiveHeight)
      }

      const minW = parseFloat(this.options.minWidth || '200px')
      const minH = parseFloat(this.options.minHeight || '150px')
      const maxW = parseFloat(this.options.maxWidth || '400px')
      const maxH = parseFloat(this.options.maxHeight || '300px')

      width = Math.max(minW, Math.min(maxW, width))
      height = Math.max(minH, Math.min(maxH, height))

      this.container.style.width = `${width}px`
      this.container.style.height = `${height}px`

      this.map.resize()
      this.setParentBounds()
    }

    updateSize()

    let resizeTimeout: ReturnType<typeof setTimeout>
    this.resizeHandler = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateSize, 100)
    }

    window.addEventListener('resize', this.resizeHandler)
  }

  toggle(): void {
    this.isMinimized = !this.isMinimized

    const collapsedWidth = this.options.collapsedWidth || '29px'
    const collapsedHeight = this.options.collapsedHeight || '29px'

    if (this.isMinimized) {
      this.container.classList.add('minimized')
      this.container.style.width = collapsedWidth
      this.container.style.height = collapsedHeight
    } else {
      this.container.classList.remove('minimized')
      if (this.options.responsive && this.resizeHandler) {
        this.resizeHandler()
      } else {
        const expandedWidth = this.options.containerStyle?.width || '400px'
        const expandedHeight = this.options.containerStyle?.height || '300px'
        this.container.style.width = expandedWidth
        this.container.style.height = expandedHeight
      }
    }

    this.options.onToggle?.(this.isMinimized)

    setTimeout(() => {
      this.map.resize()
      this.setParentBounds()
    }, 600)
  }

  isMinimizedState(): boolean {
    return this.isMinimized
  }

  private addParentRect(rect?: ParentRectConfig): void {
    if (rect === undefined || (rect.linePaint === undefined && rect.fillPaint === undefined)) {
      return
    }

    this.parentRect = {
      type: 'Feature',
      properties: { name: 'parentRect' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[], [], [], [], []]],
      },
    }

    this.map.addSource('parentRect', {
      type: 'geojson',
      data: this.parentRect,
    })

    if (rect.lineLayout !== undefined || rect.linePaint !== undefined) {
      this.map.addLayer({
        id: 'parentRectOutline',
        type: 'line',
        source: 'parentRect',
        layout: { ...(rect.lineLayout || {}) },
        paint: {
          'line-color': '#FFF',
          'line-width': 1,
          'line-opacity': 0.85,
          ...(rect.linePaint || {}),
        },
      })
    }

    if (rect.fillPaint !== undefined) {
      this.map.addLayer({
        id: 'parentRectFill',
        type: 'fill',
        source: 'parentRect',
        layout: {},
        paint: {
          'fill-color': '#08F',
          'fill-opacity': 0.135,
          ...(rect.fillPaint || {}),
        },
      })
    }

    this.setParentBounds()
  }

  private setParentBounds(): void {
    if (this.parentRect === undefined || this.isMinimized) return

    const { devicePixelRatio } = window
    const canvas = this.parentMap.getCanvas()
    const width = canvas.width / devicePixelRatio
    const height = canvas.height / devicePixelRatio

    const unproject = this.parentMap.unproject.bind(this.parentMap)
    const northWest = unproject([0, 0])
    const northEast = unproject([width, 0])
    const southWest = unproject([0, height])
    const southEast = unproject([width, height])

    this.parentRect.geometry.coordinates = [
      [
        southWest.toArray(),
        southEast.toArray(),
        northEast.toArray(),
        northWest.toArray(),
        southWest.toArray(),
      ],
    ]

    const source = this.map.getSource<GeoJSONSource>('parentRect')
    if (source !== undefined) {
      source.setData(this.parentRect)
    }
  }

  private syncMaps(): () => void {
    const { pitchAdjust } = this.options

    const parentCallback = () => {
      if (!this.isMinimized) {
        sync('parent')
      }
    }
    const minimapCallback = () => {
      if (!this.isMinimized) {
        sync('minimap')
      }
    }

    const on = () => {
      this.parentMap.on('move', parentCallback)
      this.map.on('move', minimapCallback)
    }

    const off = () => {
      this.parentMap.off('move', parentCallback)
      this.map.off('move', minimapCallback)
    }

    const sync = (which: 'parent' | 'minimap') => {
      off()

      const from = which === 'parent' ? this.parentMap : this.map
      const to = which === 'parent' ? this.map : this.parentMap

      const center = from.getCenter()
      const zoom = from.getZoom() + (this.options.zoomAdjust ?? -4) * (which === 'parent' ? 1 : -1)
      const bearing = from.getBearing()
      const pitch = from.getPitch()

      to.jumpTo({
        center,
        zoom,
        bearing,
        pitch: pitchAdjust ? pitch : 0,
      })

      this.setParentBounds()
      on()
    }

    on()

    return () => {
      off()
    }
  }
}

function _MinimapControl(props: MinimapControlProps) {
  const { position, style, ...options } = props

  // Create minimap control using useControl
  useControl<Minimap>(() => new Minimap(options), { position })

  return null
}

export const MinimapControl = memo(_MinimapControl)

// Also export the Minimap class for direct use
export { Minimap }
