/* global document */
import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  useImperativeHandle,
  useEffect,
  useMemo,
  useRef,
  useContext,
  forwardRef,
  memo,
} from 'react'
import { applyReactStyle } from '../utils/apply-react-style'

import type { Popup as PopupInstance, Marker as MarkerInstance, MarkerOptions } from '../types/lib'
import type { MarkerEvent, MarkerDragEvent } from '../types/events'

import { MapContext } from './map'
import { arePointsEqual } from '../utils/deep-equal'
import { compareClassNames } from '../utils/compare-class-names'

export type MarkerProps = MarkerOptions & {
  /** Longitude of the anchor location */
  longitude: number
  /** Latitude of the anchor location */
  latitude: number

  popup?: PopupInstance

  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties
  onClick?: (e: MarkerEvent<MouseEvent>) => void
  onDragStart?: (e: MarkerDragEvent) => void
  onDrag?: (e: MarkerDragEvent) => void
  onDragEnd?: (e: MarkerDragEvent) => void
  children?: React.ReactNode
}

export const Marker: React.FC<MarkerProps> = memo(
  forwardRef((props: MarkerProps, ref: React.Ref<MarkerInstance>) => {
    const { map, mapLib } = useContext(MapContext)
    const callbackRef = useRef<{
      onClick?: MarkerProps['onClick']
      onDragStart?: MarkerProps['onDragStart']
      onDrag?: MarkerProps['onDrag']
      onDragEnd?: MarkerProps['onDragEnd']
    }>({})

    const marker: MarkerInstance = useMemo(() => {
      let hasChildren = false
      React.Children.forEach(props.children, el => {
        if (el) {
          hasChildren = true
        }
      })
      const options = {
        ...props,
        element: hasChildren ? document.createElement('div') : undefined,
      }

      const mk = new mapLib.Marker(options)
      mk.setLngLat([props.longitude, props.latitude])

      return mk
    }, [])

    useEffect(() => {
      callbackRef.current = {
        onClick: props.onClick,
        onDragStart: props.onDragStart,
        onDrag: props.onDrag,
        onDragEnd: props.onDragEnd,
      }
    })

    useEffect(() => {
      const clickHandler = (e: MouseEvent) => {
        callbackRef.current.onClick?.({
          type: 'click',
          target: marker,
          originalEvent: e,
        })
      }

      marker.getElement().addEventListener('click', clickHandler)

      const dragStartHandler = (e: MarkerDragEvent) => {
        e.lngLat = marker.getLngLat()
        callbackRef.current.onDragStart?.(e)
      }

      const dragHandler = (e: MarkerDragEvent) => {
        e.lngLat = marker.getLngLat()
        callbackRef.current.onDrag?.(e)
      }

      const dragEndHandler = (e: MarkerDragEvent) => {
        e.lngLat = marker.getLngLat()
        callbackRef.current.onDragEnd?.(e)
      }

      marker.on('dragstart', dragStartHandler)
      marker.on('drag', dragHandler)
      marker.on('dragend', dragEndHandler)

      marker.addTo(map.getMap())

      return () => {
        marker.getElement().removeEventListener('click', clickHandler)
        marker.off('dragstart', dragStartHandler)
        marker.off('drag', dragHandler)
        marker.off('dragend', dragEndHandler)
        marker.remove()
      }
    }, [])

    const {
      longitude,
      latitude,
      offset,
      style,
      draggable = false,
      popup = null,
      rotation = 0,
      rotationAlignment = 'auto',
      pitchAlignment = 'auto',
      className,
    } = props

    useEffect(() => {
      applyReactStyle(marker.getElement(), style)
    }, [style])

    useImperativeHandle(ref, () => marker, [])

    const prevClassNameRef = useRef(className)

    useEffect(() => {
      if (marker.getLngLat().lng !== longitude || marker.getLngLat().lat !== latitude) {
        marker.setLngLat([longitude, latitude])
      }
      if (offset && !arePointsEqual(marker.getOffset(), offset)) {
        marker.setOffset(offset)
      }
      if (marker.isDraggable() !== draggable) {
        marker.setDraggable(draggable)
      }
      if (marker.getRotation() !== rotation) {
        marker.setRotation(rotation)
      }
      if (marker.getRotationAlignment() !== rotationAlignment) {
        marker.setRotationAlignment(rotationAlignment)
      }
      if (marker.getPitchAlignment() !== pitchAlignment) {
        marker.setPitchAlignment(pitchAlignment)
      }
      if (marker.getPopup() !== popup) {
        marker.setPopup(popup)
      }
      const classNameDiff = compareClassNames(prevClassNameRef.current, className)
      if (classNameDiff) {
        for (const c of classNameDiff) {
          marker.toggleClassName(c)
        }
      }
      prevClassNameRef.current = className
    })

    return createPortal(props.children, marker.getElement())
  })
)
