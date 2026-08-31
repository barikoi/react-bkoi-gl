// DRAW case — ONE URL: /?case=draw/all
// A single map hosts the DrawControl through BOTH phases: the spec dispatches
// window event 'draw:advanced' to swap basic config → advanced config
// (displayControlsDefault + custom styles + onDrawModeChange) without
// reloading the page — one map, one navigation for the whole draw module.
import { useEffect, useState } from 'react'
import { DrawControl } from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

const log = type => e =>
  window.__log({ type, features: e.features?.map(f => f.geometry.type) ?? [] })

export function DrawAll() {
  const [advanced, setAdvanced] = useState(false)
  useEffect(() => {
    const swap = () => setAdvanced(true)
    window.addEventListener('draw:advanced', swap)
    return () => window.removeEventListener('draw:advanced', swap)
  }, [])

  return (
    <Section
      title={
        advanced
          ? 'DrawControl — default toolbar + custom styles + mode events'
          : 'DrawControl — point / line / polygon / trash'
      }
    >
      <TestMap section='draw-all'>
        {advanced ? (
          <DrawControl
            position='top-left'
            displayControlsDefault
            defaultMode='simple_select'
            styles={[
              {
                id: 'gl-draw-custom-point',
                type: 'circle',
                filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint']],
                paint: { 'circle-color': '#e6a817', 'circle-radius': 8 },
              },
            ]}
            onDrawCreate={log('create')}
            onDrawDelete={log('delete')}
            onDrawSelectionChange={log('selectionchange')}
            onDrawModeChange={e => window.__log({ type: 'draw-modechange', mode: e.mode })}
          />
        ) : (
          <DrawControl
            position='top-left'
            style={{ opacity: 0.9, zIndex: 5 }}
            controls={{
              polygon: true,
              line_string: true,
              point: true,
              trash: true,
              combine_features: false,
              uncombine_features: false,
            }}
            onDrawCreate={log('create')}
            onDrawUpdate={log('update')}
            onDrawDelete={log('delete')}
            onDrawSelectionChange={log('selectionchange')}
          />
        )}
      </TestMap>
    </Section>
  )
}
