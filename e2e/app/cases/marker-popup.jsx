// MARKER & POPUP cases — one URL per case: /?case=marker-popup/basic etc.
import { useState } from 'react'
import { Marker, Popup } from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

export function MarkerBasic() {
  const [pos, setPos] = useState({ lng: 90.3938, lat: 23.8216 })
  return (
    <Section title='Markers — default, draggable, custom children'>
      <TestMap section='marker-basic'>
        <Marker data-testid='simple' longitude={90.3938} latitude={23.8216} color='red' />
        <Marker
          data-testid='draggable'
          longitude={pos.lng}
          latitude={pos.lat}
          color='blue'
          draggable
          onDragStart={() => window.__log({ type: 'dragstart' })}
          onDrag={() => window.__log({ type: 'drag' })}
          onDragEnd={e => {
            window.__log({ type: 'dragend', lngLat: { lng: e.lngLat.lng, lat: e.lngLat.lat } })
            setPos({ lng: e.lngLat.lng, lat: e.lngLat.lat })
          }}
        />
        <Marker data-testid='custom' longitude={90.4} latitude={23.83}>
          <div
            data-testid='custom-content'
            style={{ background: '#fff', padding: '5px 10px', borderRadius: 5 }}
          >
            Custom Marker
          </div>
        </Marker>
        <span
          data-testid='pos'
          style={{ display: 'none' }}
        >{`${pos.lng.toFixed(4)},${pos.lat.toFixed(4)}`}</span>
      </TestMap>
    </Section>
  )
}

export function PopupBasic() {
  const [show, setShow] = useState(true)
  return (
    <Section title='Popup — content, close button, closeOnClick'>
      <TestMap section='popup-basic'>
        <div className='map-ui'>
          <button data-testid='reopen' onClick={() => setShow(true)}>
            Reopen popup
          </button>
        </div>
        {show && (
          <Popup
            longitude={90.3938}
            latitude={23.8216}
            anchor='bottom'
            onClose={() => {
              window.__log({ type: 'popup-close' })
              setShow(false)
            }}
          >
            <div data-testid='popup-content'>
              <h3>Dhaka</h3>
              <p>Capital of Bangladesh</p>
            </div>
          </Popup>
        )}
      </TestMap>
    </Section>
  )
}

export function PopupMarkerAttached() {
  return (
    <Section title='Popup anchored to marker'>
      <TestMap section='popup-marker-attached'>
        <Marker data-testid='with-popup' longitude={90.3938} latitude={23.8216} color='red'>
          <Popup closeButton={false} anchor='bottom'>
            <div data-testid='popup-content'>Popup attached to marker</div>
          </Popup>
        </Marker>
      </TestMap>
    </Section>
  )
}

// Soft pulsing marker — docs.barikoi.com "soft-pulsing-marker" example:
// a CSS keyframe animation inside Marker children (pure pass-through).
const PULSE_CSS = `
@keyframes pulse-ring {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}
.pulse-dot {
  width: 16px; height: 16px; border-radius: 50%;
  background: #e91e63; position: relative;
}
.pulse-ring {
  position: absolute; inset: 0; border-radius: 50%;
  background: #e91e63; opacity: 0.6;
  animation: pulse-ring 1.5s ease-out infinite;
}
`

export function MarkerPulse() {
  return (
    <Section title='Soft pulsing marker — CSS animation on Marker children'>
      <style>{PULSE_CSS}</style>
      <TestMap section='marker-pulse'>
        <Marker longitude={90.3938} latitude={23.8216}>
          <div data-testid='pulse-marker' className='pulse-dot'>
            <span className='pulse-ring' />
          </div>
        </Marker>
      </TestMap>
    </Section>
  )
}
