// Mock React MapLibre
import React, { createContext, useContext } from 'react';

// Create a mock map context
export const MapContext = createContext(null);

export const useMap = () => useContext(MapContext);

// Mock Map component
export const Map = ({ children, ...props }) => {
  const mapRef = React.useRef({
    getBearing: () => 0,
    getPitch: () => 0,
    getZoom: () => 0,
    getCenter: () => ({ lat: 0, lng: 0 }),
    on: () => {},
    off: () => {},
    once: (eventName, callback) => {
      if (eventName === 'load') {
        callback();
      }
    },
    loaded: () => true,
    getContainer: () => document.createElement('div')
  });

  return (
    <MapContext.Provider value={mapRef.current}>
      <div className="bkoi-map-container">{children}</div>
    </MapContext.Provider>
  );
};

// Other mock components
export const Marker = ({ children }) => <div className="bkoi-marker">{children}</div>;
export const Popup = ({ children }) => <div className="bkoi-popup">{children}</div>;
export const Source = ({ children }) => <div className="bkoi-source">{children}</div>;
export const Layer = () => <div className="bkoi-layer" />;
export const NavigationControl = () => <div className="bkoi-nav-control" />;
export const GeolocateControl = () => <div className="bkoi-geolocate-control" />;
export const FullscreenControl = () => <div className="bkoi-fullscreen-control" />;
export const ScaleControl = () => <div className="bkoi-scale-control" />;
export const TerrainControl = () => <div className="bkoi-terrain-control" />;
export const LogoControl = () => <div className="bkoi-logo-control" />;
export const AttributionControl = () => <div className="bkoi-attribution-control" />; 