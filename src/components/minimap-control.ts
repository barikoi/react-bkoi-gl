import { memo } from 'react'
import {
  Map,
  type IControl,
  type GeoJSONSource,
  type ControlPosition,
  type StyleSpecification,
} from 'maplibre-gl'
import { useControl } from './use-control'
import { logger } from '../utils/logger'

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
  /** Custom container styles. Numeric values are treated as pixels (React `style` prop convention). */
  containerStyle?: Record<string, string | number>
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
  /** Width when minimized. Numbers are treated as pixels. */
  collapsedWidth?: string | number
  /** Height when minimized. Numbers are treated as pixels. */
  collapsedHeight?: string | number
  /** Border radius. Numbers are treated as pixels. */
  borderRadius?: string | number
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
  /** Responsive width. Numbers are treated as pixels. */
  responsiveWidth?: string | number
  /** Responsive height. Numbers are treated as pixels. */
  responsiveHeight?: string | number
  /** Minimum width. Numbers are treated as pixels. */
  minWidth?: string | number
  /** Minimum height. Numbers are treated as pixels. */
  minHeight?: string | number
  /** Maximum width. Numbers are treated as pixels. */
  maxWidth?: string | number
  /** Maximum height. Numbers are treated as pixels. */
  maxHeight?: string | number
}

export type MinimapControlProps = MinimapControlOptions

// Named constants for default values
const DEFAULT_ZOOM_ADJUST = -4
const DEFAULT_COLLAPSED_SIZE = '29px'
const DEFAULT_BORDER_RADIUS = '3px'
const TRANSITION_DURATION_MS = 600
const RESIZE_DEBOUNCE_MS = 100
const DEFAULT_WIDTH = '400px'
const DEFAULT_HEIGHT = '300px'

/**
 * Default interactions (dragPan enabled for navigation)
 */
const defaultInteractions: MinimapInteractions = {
  dragPan: true,
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

const ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
  'symbol',
  'marker',
  'pattern',
  'desc',
  'title',
])

function sanitizeElement(el: Element): void {
  // Sanitize attributes
  const attributes = Array.from(el.attributes)
  for (const attr of attributes) {
    const name = attr.name.toLowerCase()
    const value = attr.value

    // Drop all event handlers
    if (name.startsWith('on')) {
      el.removeAttribute(attr.name)
      continue
    }

    // Drop style attribute to prevent CSS exfiltration/injection
    if (name === 'style') {
      el.removeAttribute(attr.name)
      continue
    }

    // Drop dangerous values in href / xlink:href
    if (name === 'href' || name === 'xlink:href') {
      const normalizedValue = value.trim().toLowerCase()
      // Only allow local IDs (#...) or http/https URLs
      if (
        !normalizedValue.startsWith('#') &&
        !normalizedValue.startsWith('http://') &&
        !normalizedValue.startsWith('https://')
      ) {
        el.removeAttribute(attr.name)
      }
    }
  }

  // Sanitize child elements
  const childNodes = Array.from(el.childNodes)
  for (const child of childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as Element
      const tagName = childEl.tagName.toLowerCase()
      if (!ALLOWED_TAGS.has(tagName)) {
        el.removeChild(childEl)
      } else {
        sanitizeElement(childEl)
      }
    } else if (child.nodeType !== Node.TEXT_NODE && child.nodeType !== Node.CDATA_SECTION_NODE) {
      el.removeChild(child)
    }
  }
}

/**
 * Normalize a CSS value: numbers are treated as pixels, following React's
 * `style` prop convention. Strings pass through unchanged.
 */
function cssValue(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}

/**
 * Safe wrapper around CSS.supports to prevent runtime crashes in environments
 * that do not support it (e.g., Server-Side Rendering or Jest/jsdom).
 */
function supportsCSS(property: string, value: string | number): boolean {
  const css = cssValue(value)
  if (
    css.includes(';') ||
    css.includes('{') ||
    css.includes('}') ||
    css.includes('\\') ||
    /url\s*\(/i.test(css)
  ) {
    return false
  }

  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    try {
      return CSS.supports(property, css)
    } catch {
      return false
    }
  }
  return true
}

/**
 * Sanitize SVG string to prevent XSS attacks
 */
function sanitizeSVG(svgString: string): SVGElement {
  const parser = new DOMParser()
  let doc = parser.parseFromString(svgString, 'image/svg+xml')
  const parserError = doc.querySelector('parsererror')

  if (parserError || !doc.documentElement || doc.documentElement.tagName.toLowerCase() !== 'svg') {
    logger.warn('Invalid SVG format, using default icon')
    doc = parser.parseFromString(DEFAULT_ICON, 'image/svg+xml')
  }

  const svgElement = doc.documentElement
  sanitizeElement(svgElement)
  return svgElement as unknown as SVGElement
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
  private pendingStyleListener?: () => void
  private isMinimized = false
  private resizeHandler?: () => void
  private resizeTimeout?: ReturnType<typeof setTimeout>
  private transitionTimeout?: ReturnType<typeof setTimeout>
  private toggleButtonStyleEl?: HTMLStyleElement
  private liveRegion?: HTMLElement

  constructor(options: MinimapControlOptions = {}) {
    this.id = `minimap-${getRandomUUID()}`

    if (options.style !== undefined) {
      this.differentStyle = true
    }

    const interactions = { ...defaultInteractions, ...(options.interactions ?? {}) }

    const containerStyle = this.validateContainerStyle(options.containerStyle)

    this.options = {
      zoomAdjust: DEFAULT_ZOOM_ADJUST,
      position: 'top-right',
      pitchAdjust: false,
      attributionControl: false,
      logoPosition: 'bottom-left',
      toggleable: true,
      initialMinimized: false,
      collapsedWidth: DEFAULT_COLLAPSED_SIZE,
      collapsedHeight: DEFAULT_COLLAPSED_SIZE,
      borderRadius: DEFAULT_BORDER_RADIUS,
      hideText: 'Hide minimap',
      showText: 'Show minimap',
      responsive: true,
      responsiveWidth: '20vw',
      responsiveHeight: '20vh',
      minWidth: '200px',
      minHeight: '150px',
      maxWidth: DEFAULT_WIDTH,
      maxHeight: DEFAULT_HEIGHT,
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
    this.options.zoom = parentMap.getZoom() + (this.options.zoomAdjust ?? DEFAULT_ZOOM_ADJUST)
    this.options.center ??= parentMap.getCenter().toArray() as [number, number]
    this.options.bearing = parentMap.getBearing()
    this.options.pitch = this.options.pitchAdjust ? parentMap.getPitch() : 0

    // Snapshot the parent style only once it has actually loaded —
    // getStyle() before style load returns the empty default style and the
    // minimap renders blank.
    const createMinimap = () => {
      if (!this.differentStyle) {
        this.options.style = this.parentMap.getStyle()
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
    }

    const styleLoaded =
      typeof parentMap.isStyleLoaded === 'function' ? parentMap.isStyleLoaded() : true
    if (this.differentStyle || styleLoaded) {
      createMinimap()
    } else {
      // Re-arm with on (not once): styledata can fire before loading completes
      // and a one-shot listener loses the race (same pitfall as Source add).
      // 'load' is the guaranteed terminal signal — the final styledata may
      // land while isStyleLoaded() is still false.
      const tryCreate = () => {
        if (this.parentMap.isStyleLoaded()) {
          this.parentMap.off('styledata', tryCreate)
          this.parentMap.off('load', tryCreate)
          this.pendingStyleListener = undefined
          createMinimap()
        }
      }
      parentMap.on('styledata', tryCreate)
      parentMap.on('load', tryCreate)
      this.pendingStyleListener = tryCreate
    }

    return this.container
  }

  onRemove(): void {
    if (this.pendingStyleListener) {
      this.parentMap.off('styledata', this.pendingStyleListener)
      this.parentMap.off('load', this.pendingStyleListener)
      this.pendingStyleListener = undefined
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = undefined
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = undefined
    }
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout)
      this.transitionTimeout = undefined
    }
    this.toggleButtonCleanup?.()
    this.toggleButtonStyleEl?.remove()
    this.toggleButtonStyleEl = undefined
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
    styleEl.textContent = this.getContainerStyles()
    container.appendChild(styleEl)

    if (this.options.containerStyle) {
      for (const [key, value] of Object.entries(this.options.containerStyle)) {
        container.style.setProperty(key, cssValue(value))
      }
    }

    if (this.isMinimized) {
      container.style.width = cssValue(this.options.collapsedWidth || DEFAULT_COLLAPSED_SIZE)
      container.style.height = cssValue(this.options.collapsedHeight || DEFAULT_COLLAPSED_SIZE)
    }

    const preventDefault = (e: Event) => e.preventDefault()
    container.addEventListener('contextmenu', preventDefault)

    return container
  }

  private getContainerStyles(): string {
    let width = cssValue(this.options.containerStyle?.width || DEFAULT_WIDTH)
    if (!supportsCSS('width', width)) {
      width = DEFAULT_WIDTH
    }

    let height = cssValue(this.options.containerStyle?.height || DEFAULT_HEIGHT)
    if (!supportsCSS('height', height)) {
      height = DEFAULT_HEIGHT
    }

    let collapsedWidth = cssValue(this.options.collapsedWidth || DEFAULT_COLLAPSED_SIZE)
    if (!supportsCSS('width', collapsedWidth)) {
      collapsedWidth = DEFAULT_COLLAPSED_SIZE
    }

    let collapsedHeight = cssValue(this.options.collapsedHeight || DEFAULT_COLLAPSED_SIZE)
    if (!supportsCSS('height', collapsedHeight)) {
      collapsedHeight = DEFAULT_COLLAPSED_SIZE
    }

    let borderRadius = cssValue(this.options.borderRadius || DEFAULT_BORDER_RADIUS)
    if (!supportsCSS('border-radius', borderRadius)) {
      borderRadius = DEFAULT_BORDER_RADIUS
    }

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

  private validateContainerStyle(style?: Record<string, string | number>): Record<string, string> {
    const defaults = { border: '1px solid #000', width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
    if (!style) return defaults

    const validated: Record<string, string> = {}
    if (style.width) {
      const width = cssValue(style.width)
      validated.width = supportsCSS('width', width) ? width : defaults.width
    } else {
      validated.width = defaults.width
    }
    if (style.height) {
      const height = cssValue(style.height)
      validated.height = supportsCSS('height', height) ? height : defaults.height
    } else {
      validated.height = defaults.height
    }
    for (const [key, value] of Object.entries(style)) {
      if (key !== 'width' && key !== 'height') {
        validated[key] = cssValue(value)
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

    const iconNode = sanitizeSVG(this.options.toggleButton?.icon || DEFAULT_ICON)
    el.replaceChildren(iconNode)
    el.setAttribute('id', elId)
    el.setAttribute('type', 'button')
    const initialText = this.isMinimized
      ? this.options.showText || 'Show minimap'
      : this.options.hideText || 'Hide minimap'
    el.setAttribute('aria-label', initialText)
    el.setAttribute('title', initialText)
    el.setAttribute('aria-expanded', (!this.isMinimized).toString())

    if (this.options.toggleButton?.className) {
      const classes = this.options.toggleButton.className.split(' ')
      classes.forEach(cls => el.classList.add(cls))
    }

    let iconBackgroundColor = this.options.toggleButton?.iconBackgroundColor || 'black'
    if (!supportsCSS('background-color', iconBackgroundColor)) {
      iconBackgroundColor = 'black'
    }

    let hoverColor = this.options.toggleButton?.hoverColor || '#e5e7e3'
    if (!supportsCSS('background-color', hoverColor)) {
      hoverColor = '#e5e7e3'
    }

    const styleEl = document.createElement('style')
    styleEl.textContent = `
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
    }

    el.addEventListener('click', clickHandler)
    this.toggleButtonStyleEl = styleEl
    document.head.appendChild(styleEl)
    this.container.appendChild(el)

    // Create visually-hidden live region for status announcements
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    // CSS to make it visually hidden but readable by screen readers
    liveRegion.style.position = 'absolute'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.padding = '0'
    liveRegion.style.margin = '-1px'
    liveRegion.style.overflow = 'hidden'
    liveRegion.style.clip = 'rect(0, 0, 0, 0)'
    liveRegion.style.border = '0'
    this.liveRegion = liveRegion
    this.container.appendChild(liveRegion)

    this.toggleButtonCleanup = () => {
      el.removeEventListener('click', clickHandler)
      this.toggleButtonStyleEl?.remove()
      this.toggleButtonStyleEl = undefined
      this.container.removeChild(el)
      if (this.liveRegion) {
        this.container.removeChild(this.liveRegion)
        this.liveRegion = undefined
      }
    }
  }

  private setupResponsiveSizing(): void {
    if (!this.options.responsive) return

    const updateSize = () => {
      if (this.isMinimized) return

      const vw = window.innerWidth / 100
      const vh = window.innerHeight / 100

      const responsiveWidth = cssValue(this.options.responsiveWidth || '20vw')
      const responsiveHeight = cssValue(this.options.responsiveHeight || '20vh')

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

      const minW = parseFloat(cssValue(this.options.minWidth || '200px'))
      const minH = parseFloat(cssValue(this.options.minHeight || '150px'))
      const maxW = parseFloat(cssValue(this.options.maxWidth || DEFAULT_WIDTH))
      const maxH = parseFloat(cssValue(this.options.maxHeight || DEFAULT_HEIGHT))

      width = Math.max(minW, Math.min(maxW, width))
      height = Math.max(minH, Math.min(maxH, height))

      this.container.style.width = `${width}px`
      this.container.style.height = `${height}px`

      this.map.resize()
      this.setParentBounds()
    }

    updateSize()

    this.resizeHandler = () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout)
      }
      this.resizeTimeout = setTimeout(updateSize, RESIZE_DEBOUNCE_MS)
    }

    window.addEventListener('resize', this.resizeHandler)
  }

  toggle(): void {
    this.isMinimized = !this.isMinimized

    const collapsedWidth = cssValue(this.options.collapsedWidth || DEFAULT_COLLAPSED_SIZE)
    const collapsedHeight = cssValue(this.options.collapsedHeight || DEFAULT_COLLAPSED_SIZE)

    if (this.isMinimized) {
      this.container.classList.add('minimized')
      this.container.style.width = collapsedWidth
      this.container.style.height = collapsedHeight
    } else {
      this.container.classList.remove('minimized')
      if (this.options.responsive && this.resizeHandler) {
        this.resizeHandler()
      } else {
        const expandedWidth = cssValue(this.options.containerStyle?.width || DEFAULT_WIDTH)
        const expandedHeight = cssValue(this.options.containerStyle?.height || DEFAULT_HEIGHT)
        this.container.style.width = expandedWidth
        this.container.style.height = expandedHeight
      }
    }

    this.options.onToggle?.(this.isMinimized)

    const buttonEl = this.container.querySelector('button')
    if (buttonEl) {
      const text = this.isMinimized
        ? this.options.showText || 'Show minimap'
        : this.options.hideText || 'Hide minimap'
      buttonEl.setAttribute('aria-label', text)
      buttonEl.setAttribute('title', text)
      buttonEl.setAttribute('aria-expanded', (!this.isMinimized).toString())
    }

    if (this.liveRegion) {
      this.liveRegion.textContent = this.isMinimized ? 'Minimap collapsed' : 'Minimap expanded'
    }

    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout)
    }
    this.transitionTimeout = setTimeout(() => {
      this.map.resize()
      this.setParentBounds()
      this.transitionTimeout = undefined
    }, TRANSITION_DURATION_MS)
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
      const zoom =
        from.getZoom() +
        (this.options.zoomAdjust ?? DEFAULT_ZOOM_ADJUST) * (which === 'parent' ? 1 : -1)
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
  const { position, ...options } = props

  // Create minimap control using useControl
  useControl<Minimap>(() => new Minimap(options), { position })

  return null
}

export const MinimapControl = memo(_MinimapControl)

// Also export the Minimap class for direct use
export { Minimap }
