/**
 * @fileoverview Layer component for adding visual layers to a MapLibre GL map.
 *
 * Layers define how data from sources is rendered on the map. This component supports
 * all MapLibre GL layer types including fill, line, circle, symbol. raster. and more.
 *
 * @module components/layer
 * @see {@link https://maplibre.org/maplibre-gl-js/docs/layers/}
 */

import { useContext, useEffect, useMemo, useState, useRef, memo, useId } from 'react'
import { MapContext } from './map'
import assert from '../utils/assert'
import { deepEqual } from '../utils/deep-equal'
import { emitWarning } from '../utils/warn'

import type { FilterSpecification, MapLayerMouseEvent } from 'maplibre-gl'

import type { Map as MapInstance, CustomLayerInterface } from '../types/lib'
import type { LayerSpecification } from '../types/style-spec'
import type { MapInternalProperties } from '../types/internal'

/**
 * Type for layer with filter property (not all layer types have filter)
 * @private
 */
type LayerWithFilter = {
  filter?: FilterSpecification | null
  layout?: Record<string, unknown>
  paint?: Record<string, unknown>
  minzoom?: number
  maxzoom?: number
  beforeId?: string
  type?: string
  id?: string
  source?: string
}

/**
 * Utility type to make id optional in layer specification.
 * @private
 */
type OptionalId<T> = T extends { id: string } ? Omit<T, 'id'> & { id?: string } : T

/**
 * Utility type to make source optional in layer specification.
 * @private
 */
type OptionalSource<T> = T extends { source: string } ? Omit<T, 'source'> & { source?: string } : T

/**
 * Props for the Layer component.
 *
 * @typedef {Object} LayerProps
 * @property {string} [id] - Unique identifier for the layer. If not provided, one will be generated automatically.
 * @property {string} [source] - The source ID this layer should use (inherited from parent Source component).
 * @property {string} [beforeId] - If set, the layer will be inserted before the specified layer.
 * @property {function} [onClick] - Called when the layer is clicked.
 * @property {function} [onMouseEnter] - Called when the mouse enters the layer.
 * @property {function} [onMouseLeave] - Called when the mouse leaves the layer.
 * @property {function} [onMouseMove] - Called when the mouse moves over the layer.
 * @property {function} [onMouseDown] - Called when mouse button is pressed on the layer.
 * @property {function} [onMouseUp] - Called when mouse button is released on the layer.
 * @property {function} [onContextMenu] - Called on right-click context menu.
 * @property {function} [onDoubleClick] - Called on double click.
 * @extends {LayerSpecification | CustomLayerInterface}
 *
 * @example
 * ```tsx
 * // Circle layer with paint properties
 * <Layer
 *   id="points-layer"
 *   type="circle"
 *   paint={{
 *     'circle-radius': 8,
 *     'circle-color': '#007cbf'
 *   }}
 * />
 *
 * // Line layer with filter
 * <Layer
 *   id="roads-layer"
 *   type="line"
 *   source="streets"
 *   source-layer="road"
 *   filter={['==', ['get', 'type'], 'primary']}
 *   paint={{ 'line-width': 2 }}
 * />
 *
 * // Interactive layer with events
 * <Layer
 *   id="interactive-layer"
 *   type="fill"
 *   paint={{ 'fill-color': '#088' }}
 *   onClick={(e) => console.log('Clicked:', e.features)}
 *   onMouseEnter={(e) => console.log('Hover:', e.features)}
 *   onMouseLeave={() => console.log('Left layer')}
 * />
 *
 * // Custom layer
 * <Layer
 *   type="custom"
 *   renderingMode="2d"
 *   onAdd={(map) => { ... }}
 *   render={(gl, matrix) => { ... }}
 * />
 * ```
 */
export type LayerProps = (OptionalSource<OptionalId<LayerSpecification>> | CustomLayerInterface) & {
  /** If set, the layer will be inserted before the specified layer */
  beforeId?: string
  /** Called when the layer is clicked */
  onClick?: (e: MapLayerMouseEvent) => void
  /** Called when the mouse enters the layer */
  onMouseEnter?: (e: MapLayerMouseEvent) => void
  /** Called when the mouse leaves the layer */
  onMouseLeave?: () => void
  /** Called when the mouse moves over the layer */
  onMouseMove?: (e: MapLayerMouseEvent) => void
  /** Called when mouse button is pressed on the layer */
  onMouseDown?: (e: MapLayerMouseEvent) => void
  /** Called when mouse button is released on the layer */
  onMouseUp?: (e: MapLayerMouseEvent) => void
  /** Called on right-click context menu */
  onContextMenu?: (e: MapLayerMouseEvent) => void
  /** Called on double click */
  onDoubleClick?: (e: MapLayerMouseEvent) => void
}

/**
 * Updates an existing layer with new properties.
 *
 * Handles updates for:
 * - Layout properties via setLayoutProperty()
 * - Paint properties via setPaintProperty()
 * - Filter via setFilter()
 * - Zoom range via setLayerZoomRange()
 * - Layer order via moveLayer()
 *
 * @param {MapInstance} map - The MapLibre GL map instance
 * @param {string} id - Unique identifier for the layer
 * @param {LayerProps} props - New properties
 * @param {LayerProps} prevProps - Previous properties
 * @throws {Error} If layer id or type changes
 * @private
 */
function updateLayer(map: MapInstance, id: string, props: LayerProps, prevProps: LayerProps): void {
  assert(props.id === prevProps.id, 'layer id changed')
  assert(props.type === prevProps.type, 'layer type changed')

  if (props.type === 'custom' || prevProps.type === 'custom') {
    return
  }

  const propsWithFilter = props as unknown as LayerWithFilter
  const prevPropsWithFilter = prevProps as unknown as LayerWithFilter
  const { layout = {}, paint = {}, filter, minzoom, maxzoom, beforeId } = propsWithFilter

  if (beforeId !== prevPropsWithFilter.beforeId) {
    map.moveLayer(id, beforeId)
  }
  if (layout !== prevPropsWithFilter.layout) {
    const prevLayout = prevPropsWithFilter.layout || {}
    for (const key in layout) {
      if (
        Object.prototype.hasOwnProperty.call(layout, key) &&
        !deepEqual(layout[key], prevLayout[key])
      ) {
        map.setLayoutProperty(id, key as any, layout[key])
      }
    }
    for (const key in prevLayout) {
      if (
        Object.prototype.hasOwnProperty.call(prevLayout, key) &&
        !Object.prototype.hasOwnProperty.call(layout, key)
      ) {
        map.setLayoutProperty(id, key as any, undefined)
      }
    }
  }
  if (paint !== prevPropsWithFilter.paint) {
    const prevPaint = prevPropsWithFilter.paint || {}
    for (const key in paint) {
      if (
        Object.prototype.hasOwnProperty.call(paint, key) &&
        !deepEqual(paint[key], prevPaint[key])
      ) {
        map.setPaintProperty(id, key as any, paint[key])
      }
    }
    for (const key in prevPaint) {
      if (
        Object.prototype.hasOwnProperty.call(prevPaint, key) &&
        !Object.prototype.hasOwnProperty.call(paint, key)
      ) {
        map.setPaintProperty(id, key as any, undefined)
      }
    }
  }

  if (!deepEqual(filter, prevPropsWithFilter.filter)) {
    map.setFilter(id, filter ?? null)
  }
  if (minzoom !== prevPropsWithFilter.minzoom || maxzoom !== prevPropsWithFilter.maxzoom) {
    map.setLayerZoomRange(id, minzoom, maxzoom)
  }
}

/**
 * Creates a new layer on the map.
 *
 * @param {MapInstance} map - The MapLibre GL map instance
 * @param {string} id - Unique identifier for the layer
 * @param {LayerProps} props - Layer properties
 * @private
 */
function createLayer(map: MapInstance, id: string, props: LayerProps): void {
  const mapInternal = map as unknown as MapInternalProperties
  if (
    mapInternal.style &&
    mapInternal.style._loaded &&
    (!('source' in props) || map.getSource(props.source as string))
  ) {
    const options: LayerProps = { ...props, id }
    delete options.beforeId

    map.addLayer(options as LayerSpecification, props.beforeId)
  }
}

/**
 * Layer component for adding visual layers to a MapLibre GL map.
 *
 * Layers define how data from sources is rendered on the map. Supports all
 * MapLibre GL layer types including fill, line, circle, symbol, raster,
 * hillshade, heatmap, and custom layers.
 *
 * Must be a child of a Source component (for data layers) or used standalone
 * with a source prop for pre-existing sources.
 *
 * @component
 * @example
 * ```tsx
 * // Circle layer with paint properties
 * <Layer
 *   id="points-layer"
 *   type="circle"
 *   paint={{
 *     'circle-radius': 8,
 *     'circle-color': '#007cbf'
 *   }}
 * />
 *
 * // Line layer with filter
 * <Layer
 *   id="roads-layer"
 *   type="line"
 *   source="streets"
 *   source-layer="road"
 *   filter={['==', ['get', 'type'], 'primary']}
 *   paint={{ 'line-width': 2 }}
 * />
 *
 * // Inside a Source component
 * <Source id="geojson" type="geojson" data={data}>
 *   <Layer type="circle" paint={{ 'circle-radius': 6 }} />
 * </Source>
 * ```
 */
function _Layer(props: LayerProps) {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('<Layer> must be used within a Map component')
  }
  const map = context.map.getMap()
  const propsRef = useRef(props)
  const [, setStyleLoaded] = useState(0)

  // Generate a stable ID once on mount
  // Note: props.id changes after mount will trigger an error in updateLayer
  const generatedId = useId()
  const id = useMemo(
    () => props.id || `jsx-layer-${generatedId.replace(/:/g, '-')}`,
    // Empty deps - id is set once on mount and should not change
    []
  )

  // Extract event handlers
  const {
    onClick,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onMouseDown,
    onMouseUp,
    onContextMenu,
    onDoubleClick,
  } = props

  // Store callbacks in refs to avoid re-registering events
  const callbacksRef = useRef({
    onClick,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onMouseDown,
    onMouseUp,
    onContextMenu,
    onDoubleClick,
  })

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onClick,
      onMouseEnter,
      onMouseLeave,
      onMouseMove,
      onMouseDown,
      onMouseUp,
      onContextMenu,
      onDoubleClick,
    }
  }, [
    onClick,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onMouseDown,
    onMouseUp,
    onContextMenu,
    onDoubleClick,
  ])

  useEffect(() => {
    if (map) {
      const forceUpdate = () => setStyleLoaded(version => version + 1)
      map.on('styledata', forceUpdate)
      forceUpdate()

      return () => {
        map.off('styledata', forceUpdate)
        const mapInternal = map as unknown as MapInternalProperties
        if (mapInternal.style && mapInternal.style._loaded && map.getLayer(id)) {
          map.removeLayer(id)
        }
      }
    }
    return undefined
  }, [map])

  // Register layer event handlers
  useEffect(() => {
    if (!map) return undefined

    const hasEventHandler =
      onClick ||
      onMouseEnter ||
      onMouseLeave ||
      onMouseMove ||
      onMouseDown ||
      onMouseUp ||
      onContextMenu ||
      onDoubleClick

    if (!hasEventHandler) return undefined

    // Event handlers
    const handleClick = (e: MapLayerMouseEvent) => {
      callbacksRef.current.onClick?.(e)
    }

    const handleMouseEnter = (e: MapLayerMouseEvent) => {
      callbacksRef.current.onMouseEnter?.(e)
      // Change cursor to pointer
      if (callbacksRef.current.onClick) {
        map.getCanvas().style.cursor = 'pointer'
      }
    }

    const handleMouseLeave = () => {
      callbacksRef.current.onMouseLeave?.()
      // Reset cursor
      map.getCanvas().style.cursor = ''
    }

    const handleMouseMove = (e: MapLayerMouseEvent) => {
      callbacksRef.current.onMouseMove?.(e)
    }

    const handleMouseDown = (e: MapLayerMouseEvent) => {
      callbacksRef.current.onMouseDown?.(e)
    }

    const handleMouseUp = (e: MapLayerMouseEvent) => {
      callbacksRef.current.onMouseUp?.(e)
    }

    const handleContextMenu = (e: MapLayerMouseEvent) => {
      callbacksRef.current.onContextMenu?.(e)
    }

    const handleDoubleClick = (e: MapLayerMouseEvent) => {
      callbacksRef.current.onDoubleClick?.(e)
    }

    // Register events
    if (onClick) map.on('click', id, handleClick)
    if (onMouseEnter) map.on('mouseenter', id, handleMouseEnter)
    if (onMouseLeave) map.on('mouseleave', id, handleMouseLeave)
    if (onMouseMove) map.on('mousemove', id, handleMouseMove)
    if (onMouseDown) map.on('mousedown', id, handleMouseDown)
    if (onMouseUp) map.on('mouseup', id, handleMouseUp)
    if (onContextMenu) map.on('contextmenu', id, handleContextMenu)
    if (onDoubleClick) map.on('dblclick', id, handleDoubleClick)

    // Cleanup
    return () => {
      if (onClick) map.off('click', id, handleClick)
      if (onMouseEnter) map.off('mouseenter', id, handleMouseEnter)
      if (onMouseLeave) map.off('mouseleave', id, handleMouseLeave)
      if (onMouseMove) map.off('mousemove', id, handleMouseMove)
      if (onMouseDown) map.off('mousedown', id, handleMouseDown)
      if (onMouseUp) map.off('mouseup', id, handleMouseUp)
      if (onContextMenu) map.off('contextmenu', id, handleContextMenu)
      if (onDoubleClick) map.off('dblclick', id, handleDoubleClick)
    }
  }, [
    map,
    id,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onMouseDown,
    onMouseUp,
    onContextMenu,
    onDoubleClick,
  ])

  const mapInternal = map as unknown as MapInternalProperties
  const layer = map && mapInternal.style && map.getLayer(id)
  if (layer) {
    try {
      updateLayer(map, id, props, propsRef.current)
    } catch (error) {
      emitWarning(context.onWarning, error)
    }
  } else {
    createLayer(map, id, props)
  }

  // Store last rendered props
  propsRef.current = props

  return null
}

export const Layer = memo(_Layer)
