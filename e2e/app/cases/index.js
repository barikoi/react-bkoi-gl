// Case registry — ONE URL PER CASE (flat): /?case=map/basic, /?case=draw/basic…
// Controls keep the A/B/C/D review grouping in their URL prefixes.
import * as map from './map.jsx'
import * as markerPopup from './marker-popup.jsx'
import * as sourcesLayers from './sources-layers.jsx'
import * as controls from './controls.jsx'
import * as draw from './draw.jsx'
import * as hooks from './hooks.jsx'

export const CASES = {
  // Map module
  'map/basic': map.MapBasic,
  'map/no-defaults': map.MapNoDefaults,
  'map/alt-style': map.MapAltStyle,
  'map/controlled': map.MapControlled,
  'map/events': map.MapEvents,
  'map/events-extended': map.MapEventsExtended,
  'map/ref-methods': map.MapRefMethods,
  // Marker & Popup
  'marker-popup/marker-basic': markerPopup.MarkerBasic,
  'marker-popup/popup-basic': markerPopup.PopupBasic,
  'marker-popup/popup-marker-attached': markerPopup.PopupMarkerAttached,
  // Sources & Layers
  'sources-layers/geojson': sourcesLayers.SourceGeojson,
  'sources-layers/data-driven': sourcesLayers.LayerDataDriven,
  'sources-layers/layer-events': sourcesLayers.LayerEvents,
  'sources-layers/canvas': sourcesLayers.SourceCanvas,
  // Controls — group A (camera + basics)
  'controls-camera/navigation': controls.ControlsNavigation,
  'controls-camera/camera-ref': controls.ControlsCameraRef,
  'controls-camera/scale': controls.ControlsScale,
  'controls-camera/fullscreen': controls.ControlsFullscreen,
  'controls-camera/geolocate': controls.ControlsGeolocate,
  // Controls — group B (globe)
  'controls-globe/globe': controls.ControlsGlobe,
  // Controls — group C (minimap)
  'controls-minimap/minimap': controls.ControlsMinimap,
  'controls-minimap/minimap-rect': controls.ControlsMinimapRect,
  // Controls — group D (terrain)
  'controls-terrain/terrain': controls.ControlsTerrain,
  // Draw
  'draw/basic': draw.DrawBasic,
  // Hooks
  'hooks/use-map': hooks.HooksUseMap,
  'hooks/use-control': hooks.HooksUseControl,
}
