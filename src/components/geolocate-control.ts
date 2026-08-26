import * as React from 'react'
import { useImperativeHandle, useRef, useEffect, forwardRef, memo } from 'react'
import { applyReactStyle } from '../utils/apply-react-style'
import { useControl } from './use-control'

import type {
  ControlPosition,
  GeolocateControl as GeolocateControlInstance,
  GeolocateControlOptions,
} from '../types/lib'
import type { GeolocateEvent, GeolocateResultEvent, GeolocateErrorEvent } from '../types/events'

export type GeolocateControlProps = GeolocateControlOptions & {
  /** Placement of the control relative to the map. */
  position?: ControlPosition
  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties

  /** Called on each Geolocation API position update that returned as success. */
  onGeolocate?: (e: GeolocateResultEvent) => void
  /** Called on each Geolocation API position update that returned as an error. */
  onError?: (e: GeolocateErrorEvent) => void
  /** Called on each Geolocation API position update that returned as success but user position
   * is out of map `maxBounds`. */
  onOutOfMaxBounds?: (e: GeolocateResultEvent) => void
  /** Called when the GeolocateControl changes to the active lock state. */
  onTrackUserLocationStart?: (e: GeolocateEvent) => void
  /** Called when the GeolocateControl changes to the background state. */
  onTrackUserLocationEnd?: (e: GeolocateEvent) => void
}

function _GeolocateControl(props: GeolocateControlProps, ref: React.Ref<GeolocateControlInstance>) {
  const thisRef = useRef({ props })

  const ctrl = useControl(
    ({ mapLib }) => {
      const gc = new mapLib.GeolocateControl(props)

      // Hack: fix GeolocateControl reuse
      // When using React strict mode, the component is mounted twice.
      // GeolocateControl's UI creation is asynchronous. Removing and adding it back causes the UI to be initialized twice.
      const setupUI = gc._setupUI
      gc._setupUI = () => {
        if (!gc._container.hasChildNodes()) {
          setupUI()
        }
      }

      // maplibre v6: the click listener is attached in the ASYNC
      // _finishSetupUI. Under StrictMode's double mount, both queued
      // invocations attach a click listener to the SAME current button, so one
      // click fires trigger() twice — and trigger() is a toggle (ON then OFF),
      // cancelling itself: no dot, no geolocate event. Run _finishSetupUI only
      // once per button element.
      const finishUI = gc._finishSetupUI
      let finishedForButton: HTMLElement | undefined
      gc._finishSetupUI = (...args) => {
        if (gc._geolocateButton && finishedForButton === gc._geolocateButton) return
        finishedForButton = gc._geolocateButton
        return finishUI(...args)
      }

      gc.on('geolocate', e => {
        thisRef.current.props.onGeolocate?.(e as GeolocateResultEvent)
      })
      gc.on('error', e => {
        thisRef.current.props.onError?.(e as GeolocateErrorEvent)
      })
      gc.on('outofmaxbounds', e => {
        thisRef.current.props.onOutOfMaxBounds?.(e as GeolocateResultEvent)
      })
      gc.on('trackuserlocationstart', e => {
        thisRef.current.props.onTrackUserLocationStart?.(e as GeolocateEvent)
      })
      gc.on('trackuserlocationend', e => {
        thisRef.current.props.onTrackUserLocationEnd?.(e as GeolocateEvent)
      })

      return gc
    },
    { position: props.position }
  )

  thisRef.current.props = props

  useImperativeHandle(ref, () => ctrl, [])

  useEffect(() => {
    applyReactStyle(ctrl._container, props.style)
  }, [props.style])

  return null
}

export const GeolocateControl: React.FC<GeolocateControlProps> = memo(forwardRef(_GeolocateControl))
