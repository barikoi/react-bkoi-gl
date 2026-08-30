// DRAW case — one URL: /?case=draw/basic
import { DrawControl } from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

const log = type => e =>
  window.__log({ type, features: e.features?.map(f => f.geometry.type) ?? [] })

export function DrawBasic() {
  return (
    <Section title='DrawControl — point / line / polygon / trash'>
      <TestMap section='basic'>
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
      </TestMap>
    </Section>
  )
}

// DRAW advanced — one URL: /?case=draw/advanced
// Covers the README props draw/basic doesn't: displayControlsDefault (full
// toolbar incl. combine), defaultMode, custom draw `styles` array, and
// onDrawModeChange.
export function DrawAdvanced() {
  return (
    <Section title='DrawControl — default toolbar + custom styles + mode events'>
      <TestMap section='draw-advanced'>
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
      </TestMap>
    </Section>
  )
}
