import * as React from 'react'
import { useEffect, memo } from 'react'
import { applyReactStyle } from '../utils/apply-react-style'
import { useControl } from './use-control'

import type { ControlPosition } from '../types/lib'
import type { TerrainSpecification } from '../types/style-spec'

export type TerrainControlProps = TerrainSpecification & {
  /** Placement of the control relative to the map. */
  position?: ControlPosition
  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties
}

function _TerrainControl(props: TerrainControlProps) {
  // Strip wrapper-only props — maplibre v6 validates options and rejects
  // unknown keys ("position"), which breaks the control's toggle wiring.
  const { position, style, ...options } = props
  const ctrl = useControl(({ mapLib }) => new mapLib.TerrainControl(options), {
    position,
  })

  useEffect(() => {
    applyReactStyle(ctrl._container, style)
  }, [style])

  return null
}

export const TerrainControl: React.FC<TerrainControlProps> = memo(_TerrainControl)
