// Jest-based tests for Marker component
import React from 'react';
import { render } from '@testing-library/react';
import { Marker } from '../../src/components/marker';
import { MapContext } from '../../src/components/map';
import * as applyReactStyleModule from '../../src/utils/apply-react-style';
import * as compareClassNamesModule from '../../src/utils/compare-class-names';

// Mock dependencies
vi.mock('../../src/utils/apply-react-style', () => ({
  applyReactStyle: vi.fn()
}));

vi.mock('../../src/utils/compare-class-names', () => ({
  compareClassNames: vi.fn().mockReturnValue(['test-class'])
}));

// Mock for the createPortal function in react-dom
vi.mock('react-dom', async () => ({
  ...(await vi.importActual('react-dom')),
  createPortal: vi.fn((children, container) => {
    return <div data-testid="mock-portal">{children}</div>;
  })
}));

describe('Marker Component', () => {
  let mockMap;
  let mockMapLib;
  let mapContextValue;
  let mockMarkerInstance;
  let mockElement;
  let mockLngLat;

  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks();
    
    // Create a mock DOM element for the marker
    mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    
    // Create a mock LngLat for position
    mockLngLat = {
      lng: 10,
      lat: 20
    };
    
    // Create a mock marker instance
    mockMarkerInstance = {
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
      getLngLat: vi.fn().mockReturnValue(mockLngLat),
      getElement: vi.fn().mockReturnValue(mockElement),
      getOffset: vi.fn().mockReturnValue([0, 0]),
      setOffset: vi.fn(),
      isDraggable: vi.fn().mockReturnValue(false),
      setDraggable: vi.fn(),
      getRotation: vi.fn().mockReturnValue(0),
      setRotation: vi.fn(),
      getRotationAlignment: vi.fn().mockReturnValue('auto'),
      setRotationAlignment: vi.fn(),
      getPitchAlignment: vi.fn().mockReturnValue('auto'),
      setPitchAlignment: vi.fn(),
      getPopup: vi.fn().mockReturnValue(null),
      setPopup: vi.fn(),
      toggleClassName: vi.fn()
    };

    // Create mock mapLib with Marker constructor
    mockMapLib = {
      Marker: vi.fn().mockImplementation(function () { return mockMarkerInstance })
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
  });

  test('renders a marker with correct props', () => {
    const markerProps = {
      longitude: 10,
      latitude: 20,
      draggable: true,
      rotation: 45,
      offset: [5, 10],
      className: 'test-marker'
    };

    render(
      <MapContext.Provider value={mapContextValue}>
        <Marker {...markerProps}>
          <div>Marker content</div>
        </Marker>
      </MapContext.Provider>
    );

    // Check that Marker constructor was called with the correct options
    expect(mockMapLib.Marker).toHaveBeenCalledWith(expect.objectContaining({
      draggable: true,
      rotation: 45,
      offset: [5, 10],
      className: 'test-marker',
      element: expect.any(Object)
    }));

    // Check that setLngLat was called with correct coordinates
    expect(mockMarkerInstance.setLngLat).toHaveBeenCalledWith([10, 20]);

    // Check that the marker was added to the map
    expect(mockMarkerInstance.addTo).toHaveBeenCalled();
  });

  test('updates marker properties when props change', () => {
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={10}
          latitude={20}
          offset={[0, 0]}
          draggable={false}
          rotation={0}
        >
          <div>Marker content</div>
        </Marker>
      </MapContext.Provider>
    );

    // Update props
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={15}
          latitude={25}
          offset={[5, 5]}
          draggable={true}
          rotation={45}
        >
          <div>Updated content</div>
        </Marker>
      </MapContext.Provider>
    );

    // Check that coordinates were updated
    expect(mockMarkerInstance.setLngLat).toHaveBeenCalledWith([15, 25]);
    
    // Check that offset was updated
    expect(mockMarkerInstance.setOffset).toHaveBeenCalledWith([5, 5]);
    
    // Check that draggable was updated
    expect(mockMarkerInstance.setDraggable).toHaveBeenCalledWith(true);
    
    // Check that rotation was updated
    expect(mockMarkerInstance.setRotation).toHaveBeenCalledWith(45);
  });

  test('applies custom style to marker element', () => {
    const customStyle = { color: 'red', backgroundColor: 'blue' };
    const { applyReactStyle } = applyReactStyleModule;
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={10}
          latitude={20}
          style={customStyle}
        >
          <div>Styled marker</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Check that applyReactStyle was called with the element and style
    expect(applyReactStyle).toHaveBeenCalledWith(
      mockElement,
      customStyle
    );
  });

  test('handles marker click events', () => {
    const onClickMock = vi.fn();
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={10}
          latitude={20}
          onClick={onClickMock}
        >
          <div>Clickable marker</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Simulate a click event
    const clickEvent = new MouseEvent('click');
    const clickHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'click'
    )[1];
    
    clickHandler(clickEvent);
    
    // Check that onClick was called with correct event
    expect(onClickMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'click',
      originalEvent: clickEvent
    }));
  });

  test('handles marker drag events', () => {
    const onDragStartMock = vi.fn();
    const onDragMock = vi.fn();
    const onDragEndMock = vi.fn();
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={10}
          latitude={20}
          draggable={true}
          onDragStart={onDragStartMock}
          onDrag={onDragMock}
          onDragEnd={onDragEndMock}
        >
          <div>Draggable marker</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Get the event handlers
    const dragstartHandler = mockMarkerInstance.on.mock.calls.find(
      call => call[0] === 'dragstart'
    )[1];
    
    const dragHandler = mockMarkerInstance.on.mock.calls.find(
      call => call[0] === 'drag'
    )[1];
    
    const dragendHandler = mockMarkerInstance.on.mock.calls.find(
      call => call[0] === 'dragend'
    )[1];
    
    // Simulate drag events
    const dragStartEvent = { type: 'dragstart' };
    const dragEvent = { type: 'drag' };
    const dragEndEvent = { type: 'dragend' };
    
    dragstartHandler(dragStartEvent);
    dragHandler(dragEvent);
    dragendHandler(dragEndEvent);
    
    // Check that handlers were called with correct events
    // Note: maplibre-gl v6 MarkerDragEvent no longer carries lngLat on the event.
    // Callers should use marker.getLngLat() for position instead.
    expect(onDragStartMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'dragstart',
    }));
    
    expect(onDragMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'drag',
    }));
    
    expect(onDragEndMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'dragend',
    }));
  });

  test('updates rotation and alignment properties', () => {
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={10}
          latitude={20}
          rotation={0}
          rotationAlignment="auto"
          pitchAlignment="auto"
        >
          <div>Marker content</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Update rotation and alignment props
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={10}
          latitude={20}
          rotation={90}
          rotationAlignment="map"
          pitchAlignment="viewport"
        >
          <div>Marker content</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Check that rotation and alignment were updated
    expect(mockMarkerInstance.setRotation).toHaveBeenCalledWith(90);
    expect(mockMarkerInstance.setRotationAlignment).toHaveBeenCalledWith('map');
    expect(mockMarkerInstance.setPitchAlignment).toHaveBeenCalledWith('viewport');
  });

  test('updates popup when prop changes', () => {
    const mockPopup = { id: 'mock-popup' };
    
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={10}
          latitude={20}
        >
          <div>Marker content</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Update with popup
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={10}
          latitude={20}
          popup={mockPopup}
        >
          <div>Marker content</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Check that popup was set
    expect(mockMarkerInstance.setPopup).toHaveBeenCalledWith(mockPopup);
  });

  test('toggles class names when className prop changes', () => {
    const { compareClassNames } = compareClassNamesModule;
    
    const { rerender } = render(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={10}
          latitude={20}
          className="old-class"
        >
          <div>Marker content</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Update className
    rerender(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          longitude={10}
          latitude={20}
          className="new-class"
        >
          <div>Marker content</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Check that class names were compared
    expect(compareClassNames).toHaveBeenCalledWith('old-class', 'new-class');
    
    // Check that toggleClassName was called
    expect(mockMarkerInstance.toggleClassName).toHaveBeenCalledWith('test-class');
  });

  test('renders without children', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <Marker longitude={10} latitude={20} />
      </MapContext.Provider>
    );
    
    // Check that Marker constructor was called without element option
    expect(mockMapLib.Marker).toHaveBeenCalledWith(expect.objectContaining({
      longitude: 10,
      latitude: 20
    }));
    
    // Check that the marker was added to the map
    expect(mockMarkerInstance.addTo).toHaveBeenCalled();
  });

  test('forwards ref to marker instance', () => {
    const ref = React.createRef();
    
    render(
      <MapContext.Provider value={mapContextValue}>
        <Marker 
          ref={ref}
          longitude={10}
          latitude={20}
        >
          <div>Marker content</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Check that the ref contains the marker instance
    expect(ref.current).toBe(mockMarkerInstance);
  });

  test('cleans up when unmounted', () => {
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <Marker longitude={10} latitude={20}>
          <div>Marker content</div>
        </Marker>
      </MapContext.Provider>
    );
    
    // Unmount to trigger cleanup
    unmount();
    
    // Should have removed the marker
    expect(mockMarkerInstance.remove).toHaveBeenCalled();
  });
}); 