// HOOKS cases — one URL per case: /?case=hooks/use-map etc.
import { MapProvider, useControl, useMap } from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

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

class CustomControl {
  onAdd() {
    this.container = document.createElement('div')
    this.container.className = 'custom-control'
    this.container.setAttribute('data-testid', 'custom-control')
    this.container.textContent = 'Custom Control'
    return this.container
  }
  onRemove() {
    this.container.remove()
  }
}

function CustomControlComponent() {
  useControl(() => new CustomControl(), { position: 'top-left' })
  return null
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
