// HOOKS cases — one URL per case: /?case=hooks/use-map etc.
import { MapProvider, useControl, useMap } from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

// Shared buttons for the hooks cases.
function MapButtons() {
  const { current: map } = useMap()
  return (
    <div className='map-ui'>
      <button data-testid='zoom-in' onClick={() => map?.zoomIn()}>
        Zoom In
      </button>
      <button
        data-testid='fly'
        onClick={() => map?.flyTo({ center: [90.4, 23.83], zoom: 15, duration: 400 })}
      >
        Fly
      </button>
    </div>
  )
}

// Live zoom-readout IControl — visually meaningful in headed review
// (the earlier bare-control case was removed for being unreadable).
class ZoomReadoutControl {
  onAdd(map) {
    this._map = map
    this._container = document.createElement('div')
    this._container.className = 'custom-control'
    this._container.setAttribute('data-testid', 'zoom-readout')
    this._update = () => {
      this._container.textContent = `Zoom: ${map.getZoom().toFixed(1)}`
    }
    this._update()
    map.on('zoom', this._update)
    return this._container
  }

  onRemove() {
    this._map.off('zoom', this._update)
    this._container.remove()
  }
}

function ZoomReadout() {
  useControl(() => new ZoomReadoutControl(), { position: 'top-right' })
  return null
}

export function HooksUseControl() {
  return (
    <Section title='useControl — custom IControl with live zoom readout'>
      <MapProvider>
        <TestMap section='use-control'>
          <ZoomReadout />
        </TestMap>
        <MapButtons />
      </MapProvider>
    </Section>
  )
}

export function HooksUseMap() {
  return (
    <Section title='useMap — drive the map from outside <Map>'>
      <MapProvider>
        <TestMap section='use-map' />
        <MapButtons />
      </MapProvider>
    </Section>
  )
}
