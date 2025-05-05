// Jest-based tests for Map component
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Map } from '../../src/components/map';

// Mock the LogoControl and AttributionControl components
jest.mock('../../src/components/logo-control', () => ({
  LogoControl: jest.fn(() => <div data-testid="logo-control">Barikoi Logo</div>)
}));

jest.mock('../../src/components/attribution-control', () => ({
  AttributionControl: jest.fn(() => <div data-testid="attribution-control">Attribution</div>)
}));

// Create mock for maplibre-gl
jest.mock('maplibre-gl', () => {
  class MockMap {
    constructor(options) {
      this.options = options;
      this.on = jest.fn();
      this.off = jest.fn();
      this.once = jest.fn((event, callback) => {
        if (event === 'load') {
          // Simulate synchronous load for testing
          setTimeout(callback, 0);
        }
      });
      this.getCenter = jest.fn(() => ({ lng: 0, lat: 0 }));
      this.getZoom = jest.fn(() => 0);
      this.getBearing = jest.fn(() => 0);
      this.getPitch = jest.fn(() => 0);
      this.remove = jest.fn();
      this.getCanvas = jest.fn(() => ({
        style: {}
      }));
      this.getContainer = jest.fn(() => ({
        appendChild: jest.fn()
      }));
      this.isMoving = jest.fn(() => false);
      this.jumpTo = jest.fn();
      this.transform = {};
      this.style = { _loaded: true };
      
      // Add handler properties
      this.boxZoom = { enable: jest.fn(), disable: jest.fn() };
      this.scrollZoom = { enable: jest.fn(), disable: jest.fn() };
      this.dragRotate = { enable: jest.fn(), disable: jest.fn() };
      this.dragPan = { enable: jest.fn(), disable: jest.fn() };
      this.keyboard = { enable: jest.fn(), disable: jest.fn() };
      this.doubleClickZoom = { enable: jest.fn(), disable: jest.fn() };
      this.touchZoomRotate = { enable: jest.fn(), disable: jest.fn() };
      
      // Add method to query layers
      this.getLayer = jest.fn(() => true);
      this.queryRenderedFeatures = jest.fn(() => []);
      
      // Add setter methods for style components
      this.setLight = jest.fn();
      this.setProjection = jest.fn();
      this.setSky = jest.fn();
      this.setTerrain = jest.fn();
      this.setStyle = jest.fn();
    }
  }

  return {
    Map: MockMap,
    LngLat: class MockLngLat {
      constructor(lng, lat) {
        this.lng = lng;
        this.lat = lat;
      }
    },
    LogoControl: jest.fn(),
    AttributionControl: jest.fn()
  };
});

describe('Map Component', () => {
  test('renders Map component with correct props', () => {
    const { container } = render(
      <Map 
        id="test-map"
        style={{ width: '500px', height: '400px' }}
        center={[0, 0]}
        zoom={5}
      />
    );

    // Check if container div is rendered
    expect(container.querySelector('#test-map')).toBeInTheDocument();
    
    // Style should be applied
    const mapContainer = container.querySelector('#test-map');
    expect(mapContainer.style.width).toBe('500px');
    expect(mapContainer.style.height).toBe('400px');
  });

  test('renders children when map is loaded', async () => {
    let renderedComponent;
    
    act(() => {
      renderedComponent = render(
        <Map id="test-map">
          <div data-testid="test-child">Test Child</div>
        </Map>
      );
    });

    // Wait for the map to load
    await waitFor(() => {
      expect(screen.queryByTestId('test-child')).toBeInTheDocument();
    });
    
    const child = screen.getByTestId('test-child');
    expect(child.textContent).toBe('Test Child');
  });

  test('includes map children container', async () => {
    act(() => {
      render(<Map id="test-map" />);
    });

    // Wait for the map to load and controls to be added
    await waitFor(() => {
      expect(document.querySelector('[mapboxgl-children]')).toBeInTheDocument();
    });
    
    // Check if our mocked components are in the document
    expect(screen.getByTestId('logo-control')).toBeInTheDocument();
    expect(screen.getByTestId('attribution-control')).toBeInTheDocument();
  });
}); 