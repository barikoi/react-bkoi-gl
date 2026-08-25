/**
 * @fileoverview CanvasSource component for adding canvas-based data sources to a MapLibre GL map.
 *
 * Canvas sources allow rendering custom HTML canvas elements as map layers.
 * This is useful for dynamic, animated, or custom-rendered data overlays.
 *
 * @module components/canvas-source
 * @see {@link https://maplibre.org/maplibre-gl-js/docs/sources/}
 */

import * as React from 'react'
import { useContext, useEffect, useMemo, useRef, memo } from 'react'
import { MapContext } from './map'
import type { MapInternalProperties, SourceWithOptionalMethods } from '../types/internal'

/**
 * Coordinates for the canvas corners [top-left, top-right, bottom-right, bottom-left]
 */
export type CanvasCoordinates = [
  [number, number], // top-left [lng, lat]
  [number, number], // top-right [lng, lat]
  [number, number], // bottom-right [lng, lat]
  [number, number], // bottom-left [lng, lat]
]

/**
 * Props for the CanvasSource component.
 *
 * @typedef {Object} CanvasSourceProps
 * @property {string} [id] - Unique identifier for the source.
 * @property {CanvasCoordinates} coordinates - Corner coordinates of the canvas.
 * @property {HTMLCanvasElement} canvas - The canvas element to render.
 * @property {boolean} [animate] - Whether to animate the canvas (re-render on each frame).
 * @property {number} [width] - Width of the canvas context.
 * @property {number} [height] - Height of the canvas context.
 * @property {React.ReactNode} [children] - Child Layer components.
 *
 * @example
 * ```tsx
 * // Canvas source with dynamic content
 * const canvasRef = useRef<HTMLCanvasElement>(null);
 * const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
 *
 * useEffect(() => {
 *   const canvas = canvasRef.current;
 *   if (!canvas) return;
 *   const ctx = canvas.getContext('2d');
 *   if (ctx) {
 *     ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
 *     ctx.fillRect(0, 0, 100, 100);
 *   }
 *   setCanvasEl(canvas);
 * }, []);
 *
 * {canvasEl && (
 *   <CanvasSource
 *     id="canvas-source"
 *     coordinates={[
 *       [90.39, 23.83], // top-left
 *       [90.41, 23.83], // top-right
 *       [90.41, 23.81], // bottom-right
 *       [90.39, 23.81]  // bottom-left
 *     ]}
 *     canvas={canvasEl}
 *   >
 *     <Layer type="raster" paint={{ 'raster-opacity': 0.8 }} />
 *   </CanvasSource>
 * )}
 * ```
 */
export type CanvasSourceProps = {
  /** Unique identifier for the source */
  id?: string
  /** Corner coordinates of the canvas [top-left, top-right, bottom-right, bottom-left] */
  coordinates: CanvasCoordinates
  /** The canvas element to render */
  canvas: HTMLCanvasElement
  /** Whether to animate the canvas (re-render on each frame) */
  animate?: boolean
  /** Width of the canvas context */
  width?: number
  /** Height of the canvas context */
  height?: number
  /** Child Layer components */
  children?: React.ReactNode
}

/**
 * CanvasSource component for adding canvas-based data sources to a MapLibre GL map.
 *
 * Canvas sources allow rendering custom HTML canvas elements as map layers.
 * This is useful for dynamic, animated, or custom-rendered data overlays.
 *
 * @component
 * @example
 * ```tsx
 * import { Map, CanvasSource, Layer } from 'react-bkoi-gl';
 * import "react-bkoi-gl/styles";
 * import { useRef, useEffect, useState } from 'react';
 *
 * function CanvasExample() {
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *   const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
 *
 *   useEffect(() => {
 *     const canvas = canvasRef.current;
 *     if (!canvas) return;
 *
 *     const ctx = canvas.getContext('2d');
 *     if (ctx) {
 *       ctx.fillStyle = 'rgba(0, 100, 255, 0.5)';
 *       ctx.fillRect(0, 0, 256, 256);
 *       ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
 *       ctx.beginPath();
 *       ctx.arc(128, 128, 50, 0, 2 * Math.PI);
 *       ctx.fill();
 *     }
 *
 *     setCanvasEl(canvas);
 *   }, []);
 *
 *   return (
 *     <Map
 *       mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${API_KEY}`}
 *       initialViewState={{
 *         longitude: 90.3938,
 *         latitude: 23.8216,
 *         zoom: 12
 *       }}
 *     >
 *       <canvas ref={canvasRef} width={256} height={256} style={{ display: 'none' }} />
 *       {canvasEl && (
 *         <CanvasSource
 *           id="my-canvas"
 *           coordinates={[
 *             [90.38, 23.83],
 *             [90.41, 23.83],
 *             [90.41, 23.81],
 *             [90.38, 23.81]
 *           ]}
 *           canvas={canvasEl}
 *         >
 *           <Layer type="raster" paint={{ 'raster-opacity': 0.8 }} />
 *         </CanvasSource>
 *       )}
 *     </Map>
 *   );
 * }
 * ```
 */
function _CanvasSource(props: CanvasSourceProps) {
  const map = useContext(MapContext).map.getMap()
  const propsRef = useRef(props)

  const id = useMemo(() => props.id || `canvas-source-${Date.now()}`, [props.id])

  useEffect(() => {
    if (!map) return undefined

    const mapInternal = map as unknown as MapInternalProperties

    const addSource = () => {
      if (!mapInternal.style || !mapInternal.style._loaded) return
      if (map.getSource(id)) return

      const { coordinates, canvas, animate } = props

      // Add canvas source
      ;(map as any).addSource(id, {
        type: 'canvas',
        coordinates,
        canvas,
        animate: animate || false,
      })
    }

    // Wait for style to load
    if (mapInternal.style && mapInternal.style._loaded) {
      addSource()
    } else {
      map.once('styledata', addSource)
    }

    return () => {
      map.off('styledata', addSource)
      const mapInternalForCleanup = map as unknown as MapInternalProperties
      if (mapInternalForCleanup.style && mapInternalForCleanup.style._loaded && map.getSource(id)) {
        // Remove all layers using this source first
        const allLayers = map.getStyle()?.layers
        if (allLayers) {
          for (const layer of allLayers) {
            if ((layer as any).source === id) {
              map.removeLayer(layer.id)
            }
          }
        }
        map.removeSource(id)
      }
    }
  }, [map, id])

  // Update source when props change
  useEffect(() => {
    if (!map) return

    const source = map.getSource(id) as unknown as maplibregl.CanvasSource | undefined
    if (!source) return

    const { coordinates } = props
    const prevProps = propsRef.current

    // Update coordinates if changed
    if (JSON.stringify(coordinates) !== JSON.stringify(prevProps.coordinates)) {
      const sourceWithMethods = source as unknown as SourceWithOptionalMethods
      sourceWithMethods.setCoordinates?.(coordinates)
    }

    propsRef.current = props
  }, [map, id, props.coordinates, props.canvas])

  // Render children with source id
  if (!map) return null

  const mapInternal = map as unknown as MapInternalProperties
  if (!mapInternal.style || !mapInternal.style._loaded || !map.getSource(id)) {
    return null
  }

  // Clone children and pass source id
  return (
    (props.children &&
      React.Children.map(
        props.children,
        child =>
          child &&
          React.cloneElement(child as any, {
            source: id,
          })
      )) ||
    null
  )
}

export const CanvasSource = memo<CanvasSourceProps>(_CanvasSource)
