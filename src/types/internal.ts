// Internal types
import type { LngLat, PaddingOptions, Source } from 'maplibre-gl'

/**
 * maplibre's Transform interface / CameraUpdateTransformFunction argument
 */
export type TransformLike = {
  center: LngLat
  zoom: number
  roll?: number
  pitch: number
  bearing: number
  elevation: number
  padding?: PaddingOptions
}

/**
 * Internal map style interface with private properties
 */
export interface MapStyleInternal {
  _loaded: boolean
}

/**
 * Internal map properties used for map reuse and internal operations
 */
export type MapInternalProperties = {
  style: MapStyleInternal
  _container: HTMLDivElement
  _resizeObserver?: ResizeObserver
  _update: () => void
  _frame?: { cancel: () => void } | null
  _render: () => void
}

/**
 * Extended Source interface with optional update methods
 * These methods may not exist on all source types
 */
export interface SourceWithOptionalMethods extends Source {
  setCoordinates?: (coordinates: unknown) => void
  setUrl?: (url: string) => void
  setTiles?: (tiles: string[]) => void
}

/**
 * Layer with optional source property for iterating over layers from getStyle()
 */
export interface LayerWithSource {
  id: string
  source?: string
  [key: string]: unknown
}

/**
 * Map options with additional properties not in the standard types
 */
export interface MapOptionsInternal {
  attributionControl?: boolean
}

/**
 * Map with optional projection methods (may not exist in all maplibre-gl versions)
 */
export type MapWithProjection = {
  getProjection?: () => unknown
  setProjection?: (projection: unknown) => void
}

export type {
  GeoJSONSource as GeoJSONSourceImplementation,
  ImageSource as ImageSourceImplementation,
  CanvasSource as CanvasSourceImplementation,
  VectorTileSource as VectorSourceImplementation,
  RasterTileSource as RasterSourceImplementation,
  RasterDEMTileSource as RasterDemSourceImplementation,
  VideoSource as VideoSourceImplementation,
  Source as AnySourceImplementation,
} from 'maplibre-gl'
