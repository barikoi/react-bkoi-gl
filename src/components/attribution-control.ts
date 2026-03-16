import * as React from 'react'
import { useEffect, memo } from 'react'
import { applyReactStyle } from '../utils/apply-react-style'
import { useControl } from './use-control'
import { useMap } from './use-map'

import type { ControlPosition, AttributionControlOptions } from '../types/lib'

export type AttributionControlProps = AttributionControlOptions & {
  /** Placement of the control relative to the map. */
  position?: ControlPosition
  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties
}

function _AttributionControl(props: AttributionControlProps) {
  const { current: map } = useMap()

  const ctrl = useControl(
    ({ mapLib }) =>
      new mapLib.AttributionControl({
        compact: true,
        ...props,
      }),
    { position: props.position }
  )

  useEffect(() => {
    applyReactStyle(ctrl._container, props.style)

    if (!ctrl._container || !map) return

    const onLoad = () => {
      setTimeout(() => {
        const inner = ctrl._container.querySelector('.maplibregl-ctrl-attrib-inner')

        if (inner) {
          inner.innerHTML =
            '© <a href="https://barikoi.com" target="_blank">Barikoi</a> ' +
            '© <a href="https://openmaptiles.org" target="_blank">OpenMapTiles</a> ' +
            '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
        }
      }, 0)
    }

    if (map.loaded()) {
      onLoad()
    } else {
      map.once('load', onLoad)
    }

    return () => {
      map.off('load', onLoad)
    }
  }, [props.style, ctrl._container, map])

  return null
}

export const AttributionControl: React.FC<AttributionControlProps> = memo(_AttributionControl)
