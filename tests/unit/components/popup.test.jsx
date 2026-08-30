// Jest-based tests for Popup component
import React from 'react';
import { render } from '@testing-library/react';
import { Popup } from '../../../src/components/popup';
import { MapContext } from '../../../src/components/map';
import * as applyReactStyleModule from '../../../src/utils/apply-react-style';

// Mock dependencies
vi.mock('../../../src/utils/apply-react-style', () => ({
  applyReactStyle: vi.fn()
}));

// Mock for the createPortal function in react-dom
vi.mock('react-dom', async () => ({
  ...(await vi.importActual('react-dom')),
  createPortal: vi.fn((children, container) => {
    return <div data-testid="mock-portal">{children}</div>;
  })
}));

describe('Popup Component', () => {
  let mockMap;
  let mockMapLib;
  let mapContextValue;
  let mockPopupInstance;

  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks();
    
    // Create a mock popup instance
    mockPopupInstance = {
      setLngLat: vi.fn().mockReturnThis(),
      setDOMContent: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      remove: vi.fn(),
      isOpen: vi.fn().mockReturnValue(true),
      getLngLat: vi.fn().mockReturnValue({ lng: 0, lat: 0 }),
      getElement: vi.fn().mockReturnValue(document.createElement('div')),
      setOffset: vi.fn(),
      setMaxWidth: vi.fn(),
      toggleClassName: vi.fn(),
      options: {}
    };

    // Create mock mapLib with Popup constructor
    mockMapLib = {
      Popup: vi.fn().mockImplementation(function () { return mockPopupInstance })
    };

    // Create mock map
    mockMap = {
      getMap: vi.fn().mockReturnValue({})
    };

    // Create the context value
    mapContextValue = {
      map: mockMap,
      mapLib: mockMapLib
    };

    // Mock document.createElement
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = vi.fn((tagName) => {
      return originalCreateElement(tagName);
    });
  });

  afterEach(() => {
    // Restore document.createElement
    vi.restoreAllMocks();
  });

  test('renders a popup with correct props', () => {
    const popupProps = {
      longitude: 10,
      latitude: 20,
      closeButton: false,
      closeOnClick: true,
      className: 'test-popup',
      maxWidth: '300px'
    };

    render(
      <MapContext.Provider value={mapContextValue}>
        <Popup {...popupProps}>
          <div>Popup content</div>
        </Popup>
      </MapContext.Provider>
    );

    // Check that Popup constructor was called with the correct options
    expect(mockMapLib.Popup).toHaveBeenCalledWith(expect.objectContaining({
      closeButton: false,
      closeOnClick: true,
      className: 'test-popup',
      maxWidth: '300px'
    }));

    // Check that setLngLat was called with correct coordinates
    expect(mockPopupInstance.setLngLat).toHaveBeenCalledWith([10, 20]);

    // Check that the popup was added to the map
    expect(mockPopupInstance.addTo).toHaveBeenCalled();
  });

  test('registers event handlers correctly', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    render(
      <MapContext.Provider value={mapContextValue}>
        <Popup 
          longitude={10}
          latitude={20}
          onOpen={onOpen}
          onClose={onClose}
        >
          <div>Popup content</div>
        </Popup>
      </MapContext.Provider>
    );

    // Verify that event handlers were registered
    expect(mockPopupInstance.on).toHaveBeenCalledWith('open', expect.any(Function));
    expect(mockPopupInstance.on).toHaveBeenCalledWith('close', expect.any(Function));

    // Simulate 'open' event
    const openCallback = mockPopupInstance.on.mock.calls.find(call => call[0] === 'open')[1];
    openCallback({ type: 'open' });
    
    // Verify onOpen was called
    expect(onOpen).toHaveBeenCalledWith({ type: 'open' });

    // Simulate 'close' event
    const closeCallback = mockPopupInstance.on.mock.calls.find(call => call[0] === 'close')[1];
    closeCallback({ type: 'close' });
    
    // Verify onClose was called
    expect(onClose).toHaveBeenCalledWith({ type: 'close' });
  });

  test('updates popup properties when props change', () => {
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Popup 
          longitude={10}
          latitude={20}
          offset={10}
          maxWidth="200px"
          className="popup-class"
        >
          <div>Popup content</div>
        </Popup>
      </MapContext.Provider>
    );

    // Update props
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Popup 
          longitude={15}
          latitude={25}
          offset={20}
          maxWidth="300px"
          className="popup-class updated-class"
        >
          <div>Updated content</div>
        </Popup>
      </MapContext.Provider>
    );

    // Check that coordinates were updated
    expect(mockPopupInstance.setLngLat).toHaveBeenCalledWith([15, 25]);
    
    // Check that offset was updated
    expect(mockPopupInstance.setOffset).toHaveBeenCalledWith(20);
    
    // Check that maxWidth was updated
    expect(mockPopupInstance.setMaxWidth).toHaveBeenCalledWith("300px");
    
    // Check that className was toggled
    expect(mockPopupInstance.toggleClassName).toHaveBeenCalledWith("updated-class");
  });

  test('applies custom style to popup element', () => {
    const customStyle = { color: 'red', backgroundColor: 'blue' };
    const { applyReactStyle } = applyReactStyleModule;
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <Popup 
          longitude={10}
          latitude={20}
          style={customStyle}
        >
          <div>Styled popup</div>
        </Popup>
      </MapContext.Provider>
    );
    
    // Check that applyReactStyle was called with the element and style
    expect(applyReactStyle).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      customStyle
    );
  });

  test('cleans up when unmounted', () => {
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Popup longitude={10} latitude={20}>
          <div>Popup content</div>
        </Popup>
      </MapContext.Provider>
    );
    
    // Unmount to trigger cleanup
    unmount();
    
    // Should have removed event listeners
    expect(mockPopupInstance.off).toHaveBeenCalled();
    
    // Should have removed the popup if it was open
    expect(mockPopupInstance.remove).toHaveBeenCalled();
  });
}); 