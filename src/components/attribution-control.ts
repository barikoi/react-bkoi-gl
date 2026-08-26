import * as React from 'react'
import { useEffect, memo } from 'react'
import { applyReactStyle } from '../utils/apply-react-style'
import { useControl } from './use-control'
import { useMap } from './use-map'
import { logger } from '../utils/logger'

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
        // Always-expanded attribution: the Barikoi copyright must stay visible —
        // compact mode hides it behind the ⓘ toggle.
        compact: false,
        ...props,
      }),
    { position: props.position }
  )

  useEffect(() => {
    applyReactStyle(ctrl._container, props.style)

    if (!ctrl._container || !map) return

    const innerSelector = '.maplibregl-ctrl-attrib-inner'

    const applyAttribution = () => {
      const inner = ctrl._container.querySelector(innerSelector)

      if (!(inner instanceof HTMLElement)) {
        logger.warn(
          'AttributionControl: .maplibregl-ctrl-attrib-inner element not found in control container. Legally-required attribution styling was not applied.'
        )
        return
      }

      // Already applied (ours)? maplibre rebuilds the inner container on every
      // styledata/sourcedata/terrain event (tile loads land seconds after
      // load) — a one-shot rewrite gets wiped and the Barikoi copyright
      // disappears. Mark our version; re-apply whenever maplibre swaps the DOM.
      if (inner.dataset.bkoiAttrib === '1') return

      inner.textContent = ''
      inner.dataset.bkoiAttrib = '1'

      const createLink = (text: string, href: string) => {
        const a = document.createElement('a')
        a.href = href
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.textContent = text
        return a
      }

      inner.appendChild(document.createTextNode('© '))
      inner.appendChild(createLink('Barikoi', 'https://barikoi.com'))
      inner.appendChild(document.createTextNode(' © '))
      inner.appendChild(createLink('OpenMapTiles', 'https://openmaptiles.org'))
      inner.appendChild(document.createTextNode(' © '))
      inner.appendChild(
        createLink('OpenStreetMap contributors', 'https://www.openstreetmap.org/copyright')
      )
    }

    // maplibre AttributionControl re-renders its DOM on styledata/sourcedata/
    // terrain — watch the control container and re-apply after every rebuild.
    const observer = new MutationObserver(() => applyAttribution())
    observer.observe(ctrl._container, { childList: true, subtree: true })

    const onLoad = () => {
      applyAttribution()
    }

    if (map.loaded()) {
      onLoad()
    } else {
      map.once('load', onLoad)
    }

    return () => {
      observer.disconnect()
      map.off('load', onLoad)
    }
  }, [props.style, ctrl._container, map])

  return null
}

export const AttributionControl: React.FC<AttributionControlProps> = memo(_AttributionControl)
