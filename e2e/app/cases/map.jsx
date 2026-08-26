// MAP cases — ONE URL PER SECTION (no stacked maps): /?case=map/basic etc.
import { useRef, useState } from 'react'
import { Marker, Source, Layer } from 'react-bkoi-gl'
import { TestMap, DHAKA, BARIKOI_STYLE } from '../test-map.jsx'

export function Section({ title, children }) {
  return (
    <div className="case-page">
      <h1 className="case-page-title">{title}</h1>
      <div className="case-map-wrap">{children}</div>
    </div>
  )
}

export function MapBasic() {
  return (
    <Section title="Basic map — Barikoi logo + attribution (always visible)">
      <TestMap section="basic" />
    </Section>
  )
}

export function MapNoDefaults() {
  return (
    <Section title="showAttribution=false (logo always renders)">
      <TestMap section="no-defaults" showAttribution={false} />
    </Section>
  )
}

export function MapAltStyle() {
  return (
    <Section title="osm_barikoi_v2 documented style">
      <TestMap section="alt-style" mapStyle={BARIKOI_STYLE('osm_barikoi_v2')} />
    </Section>
  )
}

export function MapControlled() {
  const [viewState, setViewState] = useState({ ...DHAKA, bearing: 0, pitch: 0 })
  return (
    <Section title="Controlled viewState — click Move, camera jumps">
      <div className="map-ui">
        <button data-testid="move" onClick={() => setViewState({ ...viewState, longitude: 90.0, latitude: 23.0, zoom: 14 })}>
          Move
        </button>
      </div>
      <TestMap section="controlled" viewState={viewState} />
    </Section>
  )
}

export function MapEvents() {
  const [center, setCenter] = useState({ lng: DHAKA.longitude, lat: DHAKA.latitude })
  return (
    <Section title="Events — click map to move marker">
      <TestMap
        section="events"
        onClick={(e) => {
          window.__log({ type: 'click', lngLat: { lng: e.lngLat.lng, lat: e.lngLat.lat } })
          setCenter({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        }}
        onMoveEnd={(e) => window.__log({ type: 'moveend', viewState: e.viewState })}
        onZoomEnd={(e) => window.__log({ type: 'zoomend', zoom: e.viewState?.zoom })}
      >
        <Marker longitude={center.lng} latitude={center.lat} color="red" />
      </TestMap>
    </Section>
  )
}

export function MapEventsExtended() {
  // README Events table families not covered by map/events: drag, hover,
  // resize, idle, movestart/zoomstart. Note: map-level onMouseEnter/onMouseLeave
  // are synthetic (react-map-gl idiom) and require interactiveLayerIds + a
  // rendered feature under the pointer.
  return (
    <Section title="Events — drag / hover / zoom / resize / idle">
      <TestMap
        section="events-extended"
        interactiveLayerIds={['hover-target']}
        onDragStart={() => window.__log({ type: 'dragstart' })}
        onDrag={() => window.__log({ type: 'drag' })}
        onDragEnd={() => window.__log({ type: 'dragend' })}
        onMouseEnter={() => window.__log({ type: 'mouseenter' })}
        onMouseLeave={() => window.__log({ type: 'mouseleave' })}
        onMoveStart={() => window.__log({ type: 'movestart' })}
        onZoomStart={() => window.__log({ type: 'zoomstart' })}
        onResize={() => window.__log({ type: 'resize' })}
        onIdle={() => window.__log({ type: 'idle' })}
      >
        <Source
          id="hover-src"
          type="geojson"
          data={{
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: {},
              geometry: { type: 'Point', coordinates: [DHAKA.longitude, DHAKA.latitude] },
            }],
          }}
        >
          <Layer id="hover-target" type="circle" paint={{ 'circle-radius': 12, 'circle-color': '#f0f' }} />
        </Source>
      </TestMap>
    </Section>
  )
}

export function MapRefMethods() {
  const mapRef = useRef(null)
  const report = () => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const c = map.getCenter()
    window.__log({
      type: 'ref-report',
      center: { lng: c.lng, lat: c.lat },
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    })
  }
  return (
    <Section title="MapRef methods — Report / ZoomIn / ZoomOut / Fly">
      <div className="map-ui">
        <button data-testid="report" onClick={report}>Report</button>
        <button data-testid="zoom-in" onClick={() => mapRef.current?.getMap().zoomIn()}>ZoomIn</button>
        <button data-testid="zoom-out" onClick={() => mapRef.current?.getMap().zoomOut()}>ZoomOut</button>
        <button data-testid="fly" onClick={() => mapRef.current?.getMap().flyTo({ center: [90.4, 23.83], zoom: 15, duration: 400 })}>Fly</button>
      </div>
      <TestMap ref={mapRef} section="ref-methods" />
    </Section>
  )
}
