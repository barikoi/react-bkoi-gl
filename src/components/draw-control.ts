import * as React from 'react'
import { useEffect, useMemo, memo, useRef, useContext } from 'react'
import MapboxDraw from 'maplibre-gl-draw'
import { MapContext } from './map'

import type { ControlPosition, IControl, Map as MapInstance } from '../types/lib'

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
    style,
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

  const context = useContext(MapContext)

  if (!context) {
    throw new Error('DrawControl must be used within a Map component')
  }

  // Deep merge user options with defaults to preserve nested object properties
  const options = useMemo<DrawControlOptions>(
    () => ({
      ...defaultDrawOptions,
      ...drawOptions,
      controls: {
        ...defaultDrawOptions.controls,
        ...drawOptions.controls,
      },
    }),
    [
      drawOptions.displayControlsDefault,
      drawOptions.controls,
      drawOptions.styles,
      drawOptions.modes,
      drawOptions.defaultMode,
    ]
  )

  // Create a stable key for the options to detect changes
  const optionsKey = useMemo(() => JSON.stringify(options), [options])

  // Track callbacks in refs to avoid recreating the control for callback changes
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

  // Store control reference
  const ctrlRef = useRef<(IControl & { getMode: () => string }) | null>(null)
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
    const { map } = context
    if (!map) return

    const mapInstance = map.getMap() as MapInstance
    if (!mapInstance) return

    const DrawClass = MapboxDraw as typeof MapboxDraw & {
      new (options: DrawControlOptions): IControl & { getMode: () => string }
    }

    // Helper to reset cursor when not in drawing mode
    const resetCursorIfNeeded = () => {
      if (ctrlRef.current) {
        const currentMode = ctrlRef.current.getMode()
        if (currentMode === 'simple_select') {
          mapInstance.getCanvas().style.cursor = ''
        }
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

    // Create new control
    const ctrl = new DrawClass(options)
    ctrlRef.current = ctrl

    // Add control to map
    map.addControl(ctrl, position)

    // Store listeners for cleanup
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
    mapInstance.on('draw.create', handleCreate)
    mapInstance.on('draw.update', handleUpdate)
    mapInstance.on('draw.delete', handleDelete)
    mapInstance.on('draw.selectionchange', handleSelectionChange)
    mapInstance.on('draw.modechange', handleModeChange)
    mapInstance.on('draw.combine', handleCombine)
    mapInstance.on('draw.uncombine', handleUncombine)
    mapInstance.on('draw.render', handleRender)

    // Cleanup function
    return () => {
      // Remove event listeners
      if (listenersRef.current.handleCreate) {
        mapInstance.off('draw.create', listenersRef.current.handleCreate)
      }
      if (listenersRef.current.handleUpdate) {
        mapInstance.off('draw.update', listenersRef.current.handleUpdate)
      }
      if (listenersRef.current.handleDelete) {
        mapInstance.off('draw.delete', listenersRef.current.handleDelete)
      }
      if (listenersRef.current.handleSelectionChange) {
        mapInstance.off('draw.selectionchange', listenersRef.current.handleSelectionChange)
      }
      if (listenersRef.current.handleModeChange) {
        mapInstance.off('draw.modechange', listenersRef.current.handleModeChange)
      }
      if (listenersRef.current.handleCombine) {
        mapInstance.off('draw.combine', listenersRef.current.handleCombine)
      }
      if (listenersRef.current.handleUncombine) {
        mapInstance.off('draw.uncombine', listenersRef.current.handleUncombine)
      }
      if (listenersRef.current.handleRender) {
        mapInstance.off('draw.render', listenersRef.current.handleRender)
      }

      // Remove control from map
      if (ctrlRef.current && map.hasControl(ctrlRef.current)) {
        map.removeControl(ctrlRef.current)
      }
      ctrlRef.current = null
    }
  }, [context, optionsKey, position])

  return null
}

export const DrawControl = memo(_DrawControl)
