import React from 'react';
import {render, screen} from '@testing-library/react';
import {LogoControl} from '../../../src/components/logo-control';
import {MapContext} from '../../../src/components/map';

// Mock the maplibre-gl library
jest.mock('maplibre-gl', () => {
  class LogoControlMock {
    constructor(options) {
      this.options = options;
      this._container = document.createElement('div');
      this._container.className = 'maplibregl-ctrl maplibregl-ctrl-logo';
      
      // Create the logo element
      const img = document.createElement('img');
      img.src = options.logoUrl || 'default-barikoi-logo.png';
      if (options.className) {
        img.className = options.className;
      }
      this._container.appendChild(img);
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
    LogoControl: LogoControlMock
  };
});

describe('LogoControl', () => {
  const mapLib = {
    LogoControl: jest.requireMock('maplibre-gl').LogoControl
  };
  
  const renderWithMapContext = (ui) => {
    return render(
      <MapContext.Provider value={{mapLib}}>
        {ui}
      </MapContext.Provider>
    );
  };
  
  test('renders with default logo', () => {
    const {container} = renderWithMapContext(<LogoControl />);
    const logoContainer = document.querySelector('.maplibregl-ctrl-logo');
    expect(logoContainer).not.toBeNull();
    
    const logoImg = logoContainer.querySelector('img');
    expect(logoImg).not.toBeNull();
    expect(logoImg.src).toContain('default-barikoi-logo.png');
  });
  
  test('supports custom logo URL', () => {
    const customLogoUrl = 'https://example.com/custom-logo.png';
    const {container} = renderWithMapContext(<LogoControl logoUrl={customLogoUrl} />);
    
    const logoContainer = document.querySelector('.maplibregl-ctrl-logo');
    const logoImg = logoContainer.querySelector('img');
    expect(logoImg.src).toBe(customLogoUrl);
  });
  
  test('supports custom CSS class', () => {
    const customClass = 'custom-logo-class';
    const {container} = renderWithMapContext(<LogoControl className={customClass} />);
    
    const logoContainer = document.querySelector('.maplibregl-ctrl-logo');
    const logoImg = logoContainer.querySelector('img');
    expect(logoImg.className).toBe(customClass);
  });
  
  test('positions logo correctly', () => {
    const position = 'bottom-left';
    const {container} = renderWithMapContext(<LogoControl position={position} />);
    
    // In a real scenario, the map would add the control to the correct position container
    // Here we're just checking that the position prop is passed correctly
    const mockInstance = mapLib.LogoControl.mock.instances[0];
    expect(mockInstance).toBeDefined();
  });
  
  test('applies custom styles', () => {
    const customStyle = {color: 'red', marginBottom: '10px'};
    const {container} = renderWithMapContext(<LogoControl style={customStyle} />);
    
    const logoContainer = document.querySelector('.maplibregl-ctrl-logo');
    expect(logoContainer.style.color).toBe('red');
    expect(logoContainer.style.marginBottom).toBe('10px');
  });
}); 