import * as React from 'react'
import { useState, useRef, useEffect, useContext, useMemo, useImperativeHandle } from 'react'

import { MountedMapsContext } from './use-map'
import Maplibre, { MaplibreProps } from '../maplibre/maplibre'
import { ensureWorkerUrl } from '../maplibre/worker-setup'
import createRef, { MapRef } from '../maplibre/create-ref'

import type { CSSProperties } from 'react'
import useIsomorphicLayoutEffect from '../utils/use-isomorphic-layout-effect'
import setGlobals, { GlobalSettings } from '../utils/set-globals'
import type { MapLib, MapOptions } from '../types/lib'
import type { MapOptionsInternal } from '../types/internal'
import type { ErrorEvent } from '../types/events'
import { LogoControl } from './logo-control'
import { AttributionControl } from './attribution-control'
import { logger } from '../utils/logger'

export type MapContextValue = {
  mapLib: MapLib
  map: MapRef
  /** Consumer-supplied warning handler, propagated to child components so they
   * can surface non-fatal warnings without touching console directly. */
  onWarning?: (e: ErrorEvent) => void
}

export const MapContext = React.createContext<MapContextValue>(null)

type MapInitOptions = Omit<
  MapOptions,
  'style' | 'container' | 'bounds' | 'fitBoundsOptions' | 'center'
>

export type MapProps = MapInitOptions &
  MaplibreProps &
  GlobalSettings & {
    mapLib?: MapLib | Promise<MapLib>
    reuseMaps?: boolean
    /** Map container id */
    id?: string
    /** Map container CSS style */
    style?: CSSProperties
    children?: React.ReactNode
    /** Whether to render the map attribution control.
     * @default true
     * @remarks Attribution is required by the OpenStreetMap and MapLibre
     * license terms; keep this enabled unless you provide attribution elsewhere. */
    showAttribution?: boolean
  } & React.RefAttributes<MapRef>

function _Map(props: MapProps, ref: React.Ref<MapRef>) {
  const mountedMapsContext = useContext(MountedMapsContext)
  const [mapInstance, setMapInstance] = useState<Maplibre>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const propsRef = useRef(props)
  propsRef.current = props

  const prevPropsRef = useRef<MapProps>(props)

  const { current: contextValue } = useRef<MapContextValue>({
    mapLib: null,
    map: null,
  })

  useEffect(() => {
    const initialMapLib = propsRef.current.mapLib
    const initialId = propsRef.current.id
    const initialReuseMaps = propsRef.current.reuseMaps

    let isMounted = true
    let maplibre: Maplibre | null = null

    Promise.resolve(initialMapLib || import('maplibre-gl'))
      .then(async (module: MapLib | { default: MapLib }) => {
        if (!isMounted) {
          return
        }
        if (!module) {
          throw new Error('Invalid mapLib')
        }
        // maplibre-gl v6 ships as ESM-only (named exports, no default export).
        // Support both: named-export modules (v6) and legacy default-export bundles (v5/UMD).
        const mapboxgl =
          'Map' in module ? (module as MapLib) : (module as { default: MapLib }).default
        if (!mapboxgl.Map) {
          throw new Error('Invalid mapLib')
        }

        // Resolve the worker URL (bundled asset or Blob fallback) before the
        // engine Map is constructed — see src/maplibre/worker-setup.ts.
        await ensureWorkerUrl(mapboxgl)
        setGlobals(mapboxgl, propsRef.current)
        if (initialReuseMaps) {
          maplibre = Maplibre.reuse(propsRef.current, containerRef.current)
        }
        if (!maplibre) {
          maplibre = new Maplibre(
            mapboxgl.Map as any,
            {
              ...propsRef.current,
              attributionControl: false,
            } as MapOptions & MapOptionsInternal & MaplibreProps,
            containerRef.current
          )
        }
        if (maplibre) {
          contextValue.map = createRef(maplibre)
          contextValue.mapLib = mapboxgl
          setMapInstance(maplibre)
        }
        mountedMapsContext?.onMapMount(contextValue.map, propsRef.current.id || initialId)
      })
      .catch(error => {
        const { onError } = propsRef.current
        if (onError) {
          onError({
            type: 'error',
            target: null,
            originalEvent: null,
            error,
          })
        } else {
          logger.error(error)
        }
      })

    return () => {
      isMounted = false
      if (maplibre) {
        mountedMapsContext?.onMapUnmount(propsRef.current.id || initialId)
        if (initialReuseMaps) {
          maplibre.recycle()
        } else {
          maplibre.destroy()
        }
      }
    }
  }, [])

  // Keep latest props in a ref so this effect doesn't re-subscribe every render.
  const latestPropsRef = useRef(props)
  latestPropsRef.current = props

  useIsomorphicLayoutEffect(() => {
    if (!mapInstance) return
    const prevProps = prevPropsRef.current
    const currentProps = latestPropsRef.current
    if (!prevProps) {
      prevPropsRef.current = currentProps
      return
    }

    let propsChanged = false
    for (const key in currentProps) {
      if (key !== 'children' && key !== 'mapLib') {
        if (currentProps[key] !== prevProps[key]) {
          propsChanged = true
          break
        }
      }
    }
    if (!propsChanged) {
      for (const key in prevProps) {
        if (key !== 'children' && key !== 'mapLib') {
          if (!(key in currentProps)) {
            propsChanged = true
            break
          }
        }
      }
    }

    if (propsChanged) {
      mapInstance.setProps(currentProps)
    }
    prevPropsRef.current = currentProps
    // No dependency array: this effect must run after every render to diff
    // props and forward changes to the Maplibre instance (it subscribes to
    // nothing, so re-running is cheap; the latestPropsRef keeps it from
    // re-subscribing the map itself).
  })

  useImperativeHandle(ref, () => contextValue.map, [mapInstance])

  const style: CSSProperties = useMemo(
    () => ({
      position: 'relative',
      width: '100%',
      height: '100%',
      ...props.style,
    }),
    [props.style]
  )

  const CHILD_CONTAINER_STYLE = {
    height: '100%',
  }

  // Propagate the warning handler to children via the (stable) context value.
  contextValue.onWarning = props.onWarning

  // The outer container holds the MapLibre map. MapLibre automatically assigns
  // role="region" and aria-label="Map" to the internal canvas element.
  // Note: For keyboard accessibility (arrow keys for panning, +/- for zooming),
  // the `keyboard` option must remain enabled (defaults to true).
  return (
    <div id={props.id} ref={containerRef} style={style}>
      {mapInstance && (
        <MapContext.Provider value={contextValue}>
          <div style={CHILD_CONTAINER_STYLE}>
            {/* Barikoi logo is ALWAYS rendered (branding policy: no hide prop —
                consumers who must hide it override CSS themselves).
                Attribution can be opted out via showAttribution={false}. */}
            <LogoControl position='bottom-left' />
            {props.showAttribution !== false && <AttributionControl position='bottom-right' />}
            {props.children}
          </div>
        </MapContext.Provider>
      )}
    </div>
  )
}

/**
 * Interactive Map component using MapLibre GL.
 *
 * @remarks
 * For keyboard navigation and accessibility, the `keyboard` prop must be set to `true` (which is default).
 * If explicitly disabled (e.g. `keyboard={false}`), keyboard access (such as panning/zooming via arrow keys)
 * will be unavailable to screen reader and keyboard-only users.
 */
export const Map: React.FC<MapProps> = React.forwardRef(_Map)
