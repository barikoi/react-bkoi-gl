import * as React from 'react'
import { useEffect, memo } from 'react'
import { applyReactStyle } from '../utils/apply-react-style'
import { useControl } from './use-control'

import type {
  ControlPosition,
  LogoControlOptions,
  IControl,
  Map as MaplibreMap,
} from '../types/lib'

export type LogoControlProps = LogoControlOptions & {
  /** Placement of the control relative to the map. */
  position?: ControlPosition
  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties
}

function _LogoControl(props: LogoControlProps) {
  // Create custom control
  const ctrl = useControl(
    () => {
      const control: IControl & { _container?: HTMLElement } = {
        onAdd: (map: MaplibreMap): HTMLElement => {
          // Check if logo already exists
          if (map.getContainer) {
            const existingLogo = map
              .getContainer()
              .querySelector('a.maplibregl-ctrl-logo[href="https://www.barikoi.com"]')
            if (existingLogo) {
              existingLogo.remove()
            }
          }

          const container = document.createElement('a')
          container.className = 'maplibregl-ctrl-logo'
          container.href = 'https://www.barikoi.com'
          container.target = '_blank'
          container.setAttribute('alt', 'Barikoi')
          container.setAttribute('aria-label', 'Barikoi logo')
          container.setAttribute('rel', 'noopener nofollow')
          control._container = container
          return container
        },
        onRemove: (): void => {
          delete control._container
        },
      }
      return control
    },
    { position: props.position }
  )

  useEffect(() => {
    applyReactStyle(ctrl._container, props.style)
  }, [props.style, ctrl._container])

  return null
}

export const LogoControl: React.FC<LogoControlProps> = memo(_LogoControl)
