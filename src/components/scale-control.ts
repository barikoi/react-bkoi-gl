import * as React from 'react'
import { useEffect, useRef, memo } from 'react'
import { applyReactStyle } from '../utils/apply-react-style'
import { useControl } from './use-control'

import type { ControlPosition, ScaleControlOptions } from '../types/lib'

export type ScaleControlProps = ScaleControlOptions & {
  // These props will be further constraint by OptionsT
  unit?: string
  maxWidth?: number

  /** Placement of the control relative to the map. */
  position?: ControlPosition
  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties
}

function _ScaleControl(props: ScaleControlProps) {
  const ctrl = useControl(({ mapLib }) => new mapLib.ScaleControl(props), {
    position: props.position,
  })
  const propsRef = useRef<ScaleControlProps>(props)

  const prevProps = propsRef.current
  propsRef.current = props

  const { style, maxWidth, unit } = props

  // Move prop updates to useEffect to avoid render-phase side effects
  useEffect(() => {
    if (maxWidth !== undefined && maxWidth !== prevProps.maxWidth) {
      ctrl.options.maxWidth = maxWidth
    }
    if (unit !== undefined && unit !== prevProps.unit) {
      ctrl.setUnit(unit)
    }
  }, [ctrl, maxWidth, unit, prevProps.maxWidth, prevProps.unit])

  useEffect(() => {
    applyReactStyle(ctrl._container, style)
  }, [ctrl, style])

  return null
}

export const ScaleControl: React.FC<ScaleControlProps> = memo(_ScaleControl)
