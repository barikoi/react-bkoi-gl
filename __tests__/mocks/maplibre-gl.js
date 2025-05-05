// Mock for maplibre-gl and bkoi-gl
const mockImplementation = {
  Map: class Map {
    constructor() {
      this.on = () => {};
      this.off = () => {};
      this.once = (eventName, callback) => {
        if (eventName === 'load') {
          callback();
        }
        return {};
      };
      this.remove = () => {};
      this.getCanvas = () => ({ style: {} });
      this.getContainer = () => ({ appendChild: () => {} });
      this.addControl = () => {};
      this.removeControl = () => {};
      this.addLayer = () => {};
      this.removeLayer = () => {};
      this.getSource = () => {};
      this.addSource = () => {};
      this.removeSource = () => {};
      this.setStyle = () => {};
      this.getBearing = () => 0;
      this.setPitch = () => {};
      this.getPitch = () => 0;
      this.setZoom = () => {};
      this.getZoom = () => 0;
      this.setCenter = () => {};
      this.getCenter = () => ({ lat: 0, lng: 0 });
      this.project = () => ({ x: 0, y: 0 });
      this.unproject = () => ({ lat: 0, lng: 0 });
      this.loaded = () => true;
      this.isStyleLoaded = () => true;
      this.flyTo = () => {};
    }
  },
  LngLat: class LngLat {
    constructor(lng, lat) {
      this.lng = lng;
      this.lat = lat;
    }
    wrap() {
      return this;
    }
    toArray() {
      return [this.lng, this.lat];
    }
  },
  Marker: class Marker {
    constructor() {
      this.setLngLat = () => this;
      this.addTo = () => this;
      this.remove = () => {};
      this.getElement = () => document.createElement('div');
    }
  },
  Popup: class Popup {
    constructor() {
      this.setLngLat = () => this;
      this.setHTML = () => this;
      this.addTo = () => this;
      this.remove = () => {};
    }
  },
  NavigationControl: class NavigationControl {},
  GeolocateControl: class GeolocateControl {},
  FullscreenControl: class FullscreenControl {},
  ScaleControl: class ScaleControl {},
  AttributionControl: class AttributionControl {}
};

export default mockImplementation;

// Mock URL methods needed by maplibre
global.URL.createObjectURL = () => 'mock-url';
global.URL.revokeObjectURL = () => {}; 