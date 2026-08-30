// Shared <Map> harness for e2e cases: exposes live maplibre instances as
// window.__MAPS__[sectionId] (plus window.__MAP__ as a last-loaded alias) and
// logs lifecycle events to window.__LOG__ so specs can assert on them without
// extra plumbing per case.
import { forwardRef } from 'react'
import { Map } from 'react-bkoi-gl'

export const API_KEY = import.meta.env.BARIKOI_API_KEY || import.meta.env.API_KEY
export const BARIKOI_STYLE = (name = 'osm-liberty') =>
  `https://map.barikoi.com/styles/${name}/style.json?key=${API_KEY}`

export const DHAKA = { longitude: 90.3938, latitude: 23.8216, zoom: 12 }

export const TestMap = forwardRef(function TestMap({ onMapReady, onLoad, section, ...props }, ref) {
  return (
    <Map
      ref={ref}
      mapStyle={BARIKOI_STYLE()}
      initialViewState={DHAKA}
      {...props}
      onLoad={(e) => {
        window.__MAP__ = e.target
        if (section) {
          window.__MAPS__ = window.__MAPS__ || {}
          window.__MAPS__[section] = e.target
        }
        window.__log({ type: 'load', section })
        onMapReady?.(e)
        onLoad?.(e)
      }}
    />
  )
})
