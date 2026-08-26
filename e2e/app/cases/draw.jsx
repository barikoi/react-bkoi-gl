// DRAW case — one URL: /?case=draw/basic
import { DrawControl } from 'react-bkoi-gl'
import { TestMap } from '../test-map.jsx'
import { Section } from './map.jsx'

const log = (type) => (e) => window.__log({ type, features: e.features?.map((f) => f.geometry.type) ?? [] })

export function DrawBasic() {
  return (
    <Section title="DrawControl — point / line / polygon / trash">
      <TestMap section="basic">
        <DrawControl
          position="top-left"
          style={{ opacity: 0.9, zIndex: 5 }}
          controls={{ polygon: true, line_string: true, point: true, trash: true, combine_features: false, uncombine_features: false }}
          onDrawCreate={log('create')}
          onDrawUpdate={log('update')}
          onDrawDelete={log('delete')}
          onDrawSelectionChange={log('selectionchange')}
        />
      </TestMap>
    </Section>
  )
}
