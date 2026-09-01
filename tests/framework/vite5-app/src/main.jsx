import { createRoot } from 'react-dom/client'
import { Map } from 'react-bkoi-gl'
import 'react-bkoi-gl/styles'

// Zero config: the library resolves its own worker (bundled asset or Blob
// fallback) before the first <Map> mounts.

createRoot(document.getElementById('root')).render(
  <Map
    mapStyle={`https://map.barikoi.com/styles/osm-liberty/style.json?key=${import.meta.env.VITE_BARIKOI_API_KEY}`}
    initialViewState={{ longitude: 90.3938, latitude: 23.8216, zoom: 12 }}
    style={{ width: '100vw', height: '100vh' }}
    onLoad={() => {
      window.__READY = true
    }}
    onIdle={() => {
      window.__IDLE = true
    }}
  />
)
