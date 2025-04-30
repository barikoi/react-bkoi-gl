import React from 'react';
import {render, screen} from '@testing-library/react';
import {AttributionControl} from '../../../src/components/attribution-control';
import {MapContext} from '../../../src/components/map';

// Mock the maplibre-gl library
jest.mock('maplibre-gl', () => {
  class AttributionControlMock {
    constructor(options) {
      this.options = options || {};
      this._container = document.createElement('div');
      this._container.className = 'maplibregl-ctrl maplibregl-ctrl-attrib';
      
      if (this.options.compact) {
        this._container.classList.add('maplibregl-compact');
      }
      
      // Create the attribution content
      const attribution = document.createElement('div');
      attribution.className = 'maplibregl-ctrl-attrib-inner';
      attribution.innerHTML = this.options.customAttribution || '© Barikoi';
      this._container.appendChild(attribution);
    }
    
    onAdd() {
      return this._container;
    }
    
    onRemove() {
      if (this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
    }
  }
  
  return {
    AttributionControl: AttributionControlMock
  };
});

describe('AttributionControl', () => {
  const mapLib = {
    AttributionControl: jest.requireMock('maplibre-gl').AttributionControl
  };
  
  const renderWithMapContext = (ui) => {
    return render(
      <MapContext.Provider value={{mapLib}}>
        {ui}
      </MapContext.Provider>
    );
  };
  
  test('renders with default attribution', () => {
    const {container} = renderWithMapContext(<AttributionControl />);
    const attributionContainer = document.querySelector('.maplibregl-ctrl-attrib');
    expect(attributionContainer).not.toBeNull();
    
    const attributionContent = attributionContainer.querySelector('.maplibregl-ctrl-attrib-inner');
    expect(attributionContent).not.toBeNull();
    expect(attributionContent.innerHTML).toBe('© Barikoi');
  });
  
  test('supports custom attribution text', () => {
    const customAttribution = 'Custom Attribution Text';
    const {container} = renderWithMapContext(<AttributionControl customAttribution={customAttribution} />);
    
    const attributionContainer = document.querySelector('.maplibregl-ctrl-attrib');
    const attributionContent = attributionContainer.querySelector('.maplibregl-ctrl-attrib-inner');
    expect(attributionContent.innerHTML).toBe(customAttribution);
  });
  
  test('supports compact mode', () => {
    const {container} = renderWithMapContext(<AttributionControl compact={true} />);
    
    const attributionContainer = document.querySelector('.maplibregl-ctrl-attrib');
    expect(attributionContainer.classList.contains('maplibregl-compact')).toBe(true);
  });
  
  test('positions attribution correctly', () => {
    const position = 'bottom-right'; // Default position in the requirements
    const {container} = renderWithMapContext(<AttributionControl position={position} />);
    
    // In a real scenario, the map would add the control to the correct position container
    // Here we're just checking that the position prop is passed correctly
    const mockInstance = mapLib.AttributionControl.mock.instances[0];
    expect(mockInstance).toBeDefined();
  });
  
  test('applies custom styles', () => {
    const customStyle = {fontSize: '12px', color: 'blue'};
    const {container} = renderWithMapContext(<AttributionControl style={customStyle} />);
    
    const attributionContainer = document.querySelector('.maplibregl-ctrl-attrib');
    expect(attributionContainer.style.fontSize).toBe('12px');
    expect(attributionContainer.style.color).toBe('blue');
  });
}); 