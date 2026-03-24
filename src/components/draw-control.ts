import * as React from 'react'
import { useEffect, useMemo, memo, useRef } from 'react'
// @ts-ignore - maplibre-gl-draw doesn't have perfect types
import MapboxDraw from 'maplibre-gl-draw'
import { useControl } from './use-control'

import type { ControlPosition, IControl, Map as MapInstance } from '../types/lib'
import type { MapContextValue } from './map'

/**
 * Draw event types
 */
export interface DrawEvent {
  type: string
  features?: GeoJSON.Feature<GeoJSON.Geometry>[]
  featureIds?: string[]
  mode?: string
  originalEvent?: unknown
}

/**
 * Draw control options - extends maplibre-gl-draw options
 */
export interface DrawControlOptions {
  /** Whether controls are displayed by default */
  displayControlsDefault?: boolean
  /** Control configuration */
  controls?: {
    point?: boolean
    line_string?: boolean
    polygon?: boolean
    trash?: boolean
    combine_features?: boolean
    uncombine_features?: boolean
  }
  /** Custom styles for draw layers */
  styles?: unknown[]
  /** Available modes */
  modes?: Record<string, unknown>
  /** Default mode */
  defaultMode?: string
}

export type DrawControlProps = DrawControlOptions & {
  /** Placement of the control relative to the map. */
  position?: ControlPosition
  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties
  /** Callback fired when a feature is created */
  onDrawCreate?: (e: DrawEvent) => void
  /** Callback fired when a feature is deleted */
  onDrawDelete?: (e: DrawEvent) => void
  /** Callback fired when a feature is updated */
  onDrawUpdate?: (e: DrawEvent) => void
  /** Callback fired when the selection changes */
  onDrawSelectionChange?: (e: DrawEvent) => void
  /** Callback fired when the draw mode changes */
  onDrawModeChange?: (e: DrawEvent) => void
  /** Callback fired when features are combined */
  onDrawCombine?: (e: DrawEvent) => void
  /** Callback fired when features are uncombined */
  onDrawUncombine?: (e: DrawEvent) => void
  /** Callback fired when rendering */
  onDrawRender?: (e: DrawEvent) => void
}

/**
 * Default draw options - enables polygon and trash controls
 */
const defaultDrawOptions: DrawControlOptions = {
  displayControlsDefault: false,
  controls: {
    polygon: true,
    trash: true,
  },
}

function _DrawControl(props: DrawControlProps) {
  const {
    position,
    onDrawCreate,
    onDrawDelete,
    onDrawUpdate,
    onDrawSelectionChange,
    onDrawModeChange,
    onDrawCombine,
    onDrawUncombine,
    onDrawRender,
    ...drawOptions
  } = props

  // Merge user options with defaults
  const options = useMemo<DrawControlOptions>(
    () => ({
      ...defaultDrawOptions,
      ...drawOptions,
    }),
    [
      drawOptions.displayControlsDefault,
      drawOptions.controls,
      drawOptions.styles,
      drawOptions.modes,
      drawOptions.defaultMode,
    ]
  )

  // Track callbacks in refs to avoid recreating the control
  const callbacksRef = useRef({
    onDrawCreate,
    onDrawDelete,
    onDrawUpdate,
    onDrawSelectionChange,
    onDrawModeChange,
    onDrawCombine,
    onDrawUncombine,
    onDrawRender,
  })
  const listenersRef = useRef<{
    handleCreate?: (e: DrawEvent) => void
    handleUpdate?: (e: DrawEvent) => void
    handleDelete?: (e: DrawEvent) => void
    handleSelectionChange?: (e: DrawEvent) => void
    handleModeChange?: (e: DrawEvent) => void
    handleCombine?: (e: DrawEvent) => void
    handleUncombine?: (e: DrawEvent) => void
    handleRender?: (e: DrawEvent) => void
  }>({})

  useEffect(() => {
    callbacksRef.current = {
      onDrawCreate,
      onDrawDelete,
      onDrawUpdate,
      onDrawSelectionChange,
      onDrawModeChange,
      onDrawCombine,
      onDrawUncombine,
      onDrawRender,
    }
  }, [
    onDrawCreate,
    onDrawDelete,
    onDrawUpdate,
    onDrawSelectionChange,
    onDrawModeChange,
    onDrawCombine,
    onDrawUncombine,
    onDrawRender,
  ])

  // Create the draw control using useControl hook
  const ctrl = useControl<IControl & { getMode: () => string }>(
    ({ mapLib }: MapContextValue) => {
      // @ts-ignore - maplibre-gl-draw types
      const DrawClass = MapboxDraw as typeof MapboxDraw & {
        new (options: DrawControlOptions): IControl & { getMode: () => string }
      }
      return new DrawClass(options)
    },
    (context: MapContextValue) => {
      const map = context.map.getMap() as MapInstance
      if (!map) return

      // Helper to reset cursor when not in drawing mode
      const resetCursorIfNeeded = () => {
        const currentMode = ctrl.getMode()
        if (currentMode === 'simple_select') {
          map.getCanvas().style.cursor = ''
        }
      }

      // Event handlers
      const handleCreate = (e: DrawEvent) => {
        resetCursorIfNeeded()
        callbacksRef.current.onDrawCreate?.(e)
      }

      const handleUpdate = (e: DrawEvent) => {
        resetCursorIfNeeded()
        callbacksRef.current.onDrawUpdate?.(e)
      }

      const handleDelete = (e: DrawEvent) => {
        resetCursorIfNeeded()
        callbacksRef.current.onDrawDelete?.(e)
      }

      const handleSelectionChange = (e: DrawEvent) => {
        resetCursorIfNeeded()
        callbacksRef.current.onDrawSelectionChange?.(e)
      }

      const handleModeChange = (e: DrawEvent) => {
        resetCursorIfNeeded()
        callbacksRef.current.onDrawModeChange?.(e)
      }
      const handleCombine = (e: DrawEvent) => {
        callbacksRef.current.onDrawCombine?.(e)
      }
      const handleUncombine = (e: DrawEvent) => {
        callbacksRef.current.onDrawUncombine?.(e)
      }
      const handleRender = (e: DrawEvent) => {
        callbacksRef.current.onDrawRender?.(e)
      }
      listenersRef.current = {
        handleCreate,
        handleUpdate,
        handleDelete,
        handleSelectionChange,
        handleModeChange,
        handleCombine,
        handleUncombine,
        handleRender,
      }

      // Add event listeners
      map.on('draw.create', handleCreate)
      map.on('draw.update', handleUpdate)
      map.on('draw.delete', handleDelete)
      map.on('draw.selectionchange', handleSelectionChange)
      map.on('draw.modechange', handleModeChange)
      map.on('draw.combine', handleCombine)
      map.on('draw.uncombine', handleUncombine)
      map.on('draw.render', handleRender)
    },
    (context: MapContextValue) => {
      const map = context.map.getMap() as MapInstance
      if (!map) return

      if (listenersRef.current.handleCreate) {
        map.off('draw.create', listenersRef.current.handleCreate)
      }
      if (listenersRef.current.handleUpdate) {
        map.off('draw.update', listenersRef.current.handleUpdate)
      }
      if (listenersRef.current.handleDelete) {
        map.off('draw.delete', listenersRef.current.handleDelete)
      }
      if (listenersRef.current.handleSelectionChange) {
        map.off('draw.selectionchange', listenersRef.current.handleSelectionChange)
      }
      if (listenersRef.current.handleModeChange) {
        map.off('draw.modechange', listenersRef.current.handleModeChange)
      }
      if (listenersRef.current.handleCombine) {
        map.off('draw.combine', listenersRef.current.handleCombine)
      }
      if (listenersRef.current.handleUncombine) {
        map.off('draw.uncombine', listenersRef.current.handleUncombine)
      }
      if (listenersRef.current.handleRender) {
        map.off('draw.render', listenersRef.current.handleRender)
      }
    },
    { position }
  )

  return null
}

export const DrawControl = memo(_DrawControl)
