import * as React from 'react'
import { useEffect, useMemo, memo, useContext, useRef } from 'react'
// @ts-ignore - maplibre-gl-draw doesn't have perfect types
import MapboxDraw from 'maplibre-gl-draw'
import { MapContext } from './map'

import type { ControlPosition, IControl, Map as MapInstance } from '../types/lib'

/**
 * Draw control options
 */
export type DrawControlOptions = Record<string, unknown>

export type DrawControlProps = DrawControlOptions & {
  /** Placement of the control relative to the map. */
  position?: ControlPosition
  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties
  /** Callback fired when a feature is created */

  onDrawCreate?: (e: any) => void
  /** Callback fired when a feature is deleted */

  onDrawDelete?: (e: any) => void
  /** Callback fired when a feature is updated */

  onDrawUpdate?: (e: any) => void
  /** Callback fired when the selection changes */

  onDrawSelectionChange?: (e: any) => void
  /** Callback fired when the draw mode changes */

  onDrawModeChange?: (e: any) => void
  /** Callback fired when a feature is combined */

  onDrawCombine?: (e: any) => void
  /** Callback fired when a feature is uncombined */

  onDrawUncombine?: (e: any) => void
  /** Callback fired when rendering */

  onDrawRender?: (e: any) => void
}

/**
 * Default draw options - enables polygon and trash controls
 */
const defaultDrawOptions = {
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

  // Get the map context
  const context = useContext(MapContext)

  const drawRef = useRef<any>(null)
  const controlRef = useRef<IControl | null>(null)

  // Merge user options with defaults
  const options = useMemo(
    () => ({
      ...defaultDrawOptions,
      ...drawOptions,
    }),

    [JSON.stringify(drawOptions)]
  )

  // Create and add the draw control
  useEffect(() => {
    if (!context.map) return

    const map = context.map.getMap() as MapInstance
    if (!map) return

    // Create the draw control

    const draw = new (MapboxDraw as any)(options)
    drawRef.current = draw
    controlRef.current = draw as IControl

    // Add control to map
    map.addControl(controlRef.current, position)

    // Helper to reset cursor when not in drawing mode
    const resetCursorIfNeeded = () => {
      const currentMode = draw.getMode()
      if (currentMode === 'simple_select') {
        map.getCanvas().style.cursor = ''
      }
    }

    // Event handlers with cursor reset

    const handleCreate = (e: any) => {
      resetCursorIfNeeded()
      onDrawCreate?.(e)
    }

    const handleUpdate = (e: any) => {
      resetCursorIfNeeded()
      onDrawUpdate?.(e)
    }

    const handleDelete = (e: any) => {
      resetCursorIfNeeded()
      onDrawDelete?.(e)
    }

    const handleSelectionChange = (e: any) => {
      resetCursorIfNeeded()
      onDrawSelectionChange?.(e)
    }

    const handleModeChange = (e: any) => {
      resetCursorIfNeeded()
      onDrawModeChange?.(e)
    }

    // Add event listeners
    map.on('draw.create', handleCreate)
    map.on('draw.update', handleUpdate)
    map.on('draw.delete', handleDelete)
    map.on('draw.selectionchange', handleSelectionChange)
    map.on('draw.modechange', handleModeChange)

    if (onDrawCombine) {
      map.on('draw.combine', onDrawCombine)
    }
    if (onDrawUncombine) {
      map.on('draw.uncombine', onDrawUncombine)
    }
    if (onDrawRender) {
      map.on('draw.render', onDrawRender)
    }

    // Cleanup function
    return () => {
      map.off('draw.create', handleCreate)
      map.off('draw.update', handleUpdate)
      map.off('draw.delete', handleDelete)
      map.off('draw.selectionchange', handleSelectionChange)
      map.off('draw.modechange', handleModeChange)

      if (onDrawCombine) {
        map.off('draw.combine', onDrawCombine)
      }
      if (onDrawUncombine) {
        map.off('draw.uncombine', onDrawUncombine)
      }
      if (onDrawRender) {
        map.off('draw.render', onDrawRender)
      }

      // Remove control from map
      if (controlRef.current && map.hasControl(controlRef.current)) {
        map.removeControl(controlRef.current)
      }

      drawRef.current = null
      controlRef.current = null
    }
  }, [
    context.map,
    position,
    options,
    onDrawCreate,
    onDrawUpdate,
    onDrawDelete,
    onDrawSelectionChange,
    onDrawModeChange,
    onDrawCombine,
    onDrawUncombine,
    onDrawRender,
  ])

  return null
}

export const DrawControl = memo(_DrawControl)
