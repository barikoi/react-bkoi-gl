import type {
  Map,
  MapOptions,
  Marker,
  MarkerOptions,
  Popup,
  PopupOptions,
  AttributionControl,
  AttributionControlOptions,
  FullscreenControl,
  FullscreenControlOptions,
  GeolocateControl,
  GeolocateControlOptions,
  NavigationControl,
  NavigationControlOptions,
  ScaleControl,
  ScaleControlOptions,
  TerrainControl,
  TerrainSpecification,
  LogoControl,
  LogoControlOptions,
  MapMouseEvent as MapMouseEventBase,
} from 'maplibre-gl'

// Re-export MapMouseEvent as MapMouseEventBase for internal use
// Note: The extended MapMouseEvent with additional features is exported from types/events.ts
export type {
  ControlPosition,
  IControl,
  Map,
  MapOptions,
  Marker,
  MarkerOptions,
  Popup,
  PopupOptions,
  AttributionControl,
  AttributionControlOptions,
  FullscreenControl,
  FullscreenControlOptions,
  GeolocateControl,
  GeolocateControlOptions,
  NavigationControl,
  NavigationControlOptions,
  ScaleControl,
  ScaleControlOptions,
  TerrainControl,
  LogoControl,
  LogoControlOptions,
  CustomLayerInterface,
} from 'maplibre-gl'

// Re-export the base MapMouseEvent type for internal use (extended version is in events.ts)
export type { MapMouseEventBase }

/**
 * A user-facing type that represents the minimal intersection between Mapbox and Maplibre
 * User provided `mapLib` is supposed to implement this interface
 * Only losely typed for compatibility
 */
export interface MapLib {
  supported?: (options: unknown) => boolean

  Map: { new (options: MapOptions): Map }

  Marker: { new (options: MarkerOptions): Marker }

  Popup: { new (options: PopupOptions): Popup }

  AttributionControl: {
    new (options: AttributionControlOptions): AttributionControl
  }

  FullscreenControl: {
    new (options: FullscreenControlOptions): FullscreenControl
  }

  GeolocateControl: {
    new (options: GeolocateControlOptions): GeolocateControl
  }

  NavigationControl: {
    new (options: NavigationControlOptions): NavigationControl
  }

  ScaleControl: { new (options: ScaleControlOptions): ScaleControl }

  TerrainControl: { new (options: TerrainSpecification): TerrainControl }

  LogoControl: { new (options: LogoControlOptions): LogoControl }
}
