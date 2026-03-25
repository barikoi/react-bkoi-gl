/* global document */
import * as React from 'react'
import { createPortal } from 'react-dom'
import { useImperativeHandle, useEffect, useMemo, useContext, forwardRef, memo } from 'react'
import { applyReactStyle } from '../utils/apply-react-style'

import type { Popup as PopupInstance, PopupOptions, MapMouseEventBase } from '../types/lib'
import type { PopupEvent } from '../types/events'

import { MapContext } from './map'
import { compareClassNames } from '../utils/compare-class-names'

export type PopupProps = PopupOptions & {
  /** Longitude of the anchor location */
  longitude: number
  /** Latitude of the anchor location */
  latitude: number

  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties

  onOpen?: (e: PopupEvent) => void
  onClose?: (e: PopupEvent) => void
  children?: React.ReactNode
}

export const Popup: React.FC<PopupProps> = memo(
  forwardRef((props: PopupProps, ref: React.Ref<PopupInstance>) => {
    const { map, mapLib } = useContext(MapContext)
    const container = useMemo(() => {
      return document.createElement('div')
    }, [])

    const popup: PopupInstance = useMemo(() => {
      const options = { ...props }
      const pp = new mapLib.Popup(options)
      pp.setLngLat([props.longitude, props.latitude])
      return pp
    }, [])

    useImperativeHandle(ref, () => popup, [])

    useEffect(() => {
      const onOpen = (e: MapMouseEventBase) => {
        props.onOpen?.(e as unknown as PopupEvent)
      }
      const onClose = (e: MapMouseEventBase) => {
        props.onClose?.(e as unknown as PopupEvent)
      }
      popup.on('open', onOpen)
      popup.on('close', onClose)
      popup.setDOMContent(container).addTo(map.getMap())

      return () => {
        // https://github.com/visgl/react-map-gl/issues/1825
        // onClose should not be fired if the popup is removed by unmounting
        // When using React strict mode, the component is mounted twice.
        // Firing the onClose callback here would be a false signal to remove the component.
        popup.off('open', onOpen)
        popup.off('close', onClose)
        if (popup.isOpen()) {
          popup.remove()
        }
      }
    }, [])

    useEffect(() => {
      applyReactStyle(popup.getElement(), props.style)
    }, [props.style])

    useEffect(() => {
      if (popup.isOpen()) {
        if (popup.getLngLat().lng !== props.longitude || popup.getLngLat().lat !== props.latitude) {
          popup.setLngLat([props.longitude, props.latitude])
        }
      }
    }, [props.longitude, props.latitude])

    useEffect(() => {
      if (popup.isOpen() && props.offset) {
        popup.setOffset(props.offset)
      }
    }, [props.offset])

    useEffect(() => {
      if (popup.isOpen() && props.maxWidth !== undefined) {
        popup.setMaxWidth(props.maxWidth)
      }
    }, [props.maxWidth])

    useEffect(() => {
      if (popup.isOpen() && props.className) {
        const currentClassName = popup.options.className || ''
        const classNameDiff = compareClassNames(currentClassName, props.className)
        if (classNameDiff) {
          for (const c of classNameDiff) {
            popup.toggleClassName(c)
          }
        }
      }
    }, [props.className])

    return createPortal(props.children, container)
  })
)
