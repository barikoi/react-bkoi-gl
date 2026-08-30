// Jest-based tests for transform utility
import { transformToViewState, applyViewStateToTransform } from '../../../src/utils/transform';

describe('transform', () => {
  describe('transformToViewState', () => {
    test('converts transform to view state', () => {
      const transform = {
        center: {
          lng: 10,
          lat: 20
        },
        zoom: 5,
        bearing: 45,
        pitch: 30
      };
      
      const viewState = transformToViewState(transform);
      
      expect(viewState).toEqual({
        longitude: 10,
        latitude: 20,
        zoom: 5,
        bearing: 45,
        pitch: 30,
        padding: undefined
      });
    });
    
    test('handles padding', () => {
      const transform = {
        center: {
          lng: 10,
          lat: 20
        },
        zoom: 5,
        bearing: 45,
        pitch: 30,
        padding: { left: 10, right: 10, top: 10, bottom: 10 }
      };
      
      const viewState = transformToViewState(transform);
      
      expect(viewState).toEqual({
        longitude: 10,
        latitude: 20,
        zoom: 5,
        bearing: 45,
        pitch: 30,
        padding: { left: 10, right: 10, top: 10, bottom: 10 }
      });
    });
  });
  
  describe('applyViewStateToTransform', () => {
    test('returns changes based on viewState prop', () => {
      const transform = {
        center: {
          lng: 0,
          lat: 0,
          constructor: function LngLat(lng, lat) {
            return { lng, lat };
          }
        },
        zoom: 0,
        bearing: 0,
        pitch: 0
      };
      
      const props = {
        viewState: {
          longitude: 10,
          latitude: 20,
          zoom: 5,
          bearing: 45,
          pitch: 30
        }
      };
      
      const changes = applyViewStateToTransform(transform, props);
      
      expect(changes).toEqual({
        center: { lng: 10, lat: 20 },
        zoom: 5,
        bearing: 45,
        pitch: 30
      });
    });
    
    test('returns changes based on direct props', () => {
      const transform = {
        center: {
          lng: 0,
          lat: 0,
          constructor: function LngLat(lng, lat) {
            return { lng, lat };
          }
        },
        zoom: 0,
        bearing: 0,
        pitch: 0
      };
      
      const props = {
        longitude: 10,
        latitude: 20,
        zoom: 5,
        bearing: 45,
        pitch: 30
      };
      
      const changes = applyViewStateToTransform(transform, props);
      
      expect(changes).toEqual({
        center: { lng: 10, lat: 20 },
        zoom: 5,
        bearing: 45,
        pitch: 30
      });
    });
    
    test('only returns changed properties', () => {
      const transform = {
        center: {
          lng: 10,
          lat: 20,
          constructor: function LngLat(lng, lat) {
            return { lng, lat };
          }
        },
        zoom: 5,
        bearing: 0,
        pitch: 0
      };
      
      const props = {
        longitude: 10,
        latitude: 20,
        bearing: 45,
        pitch: 30
      };
      
      const changes = applyViewStateToTransform(transform, props);
      
      expect(changes).toEqual({
        bearing: 45,
        pitch: 30
      });
    });

    test('handles padding changes', () => {
      const transform = {
        center: {
          lng: 10,
          lat: 20,
          constructor: function LngLat(lng, lat) {
            return { lng, lat };
          }
        },
        zoom: 5,
        bearing: 0,
        pitch: 0,
        padding: { left: 0, right: 0, top: 0, bottom: 0 }
      };
      
      const props = {
        padding: { left: 10, right: 10, top: 10, bottom: 10 }
      };
      
      const changes = applyViewStateToTransform(transform, props);
      
      expect(changes).toEqual({
        padding: { left: 10, right: 10, top: 10, bottom: 10 }
      });
    });
  });
}); 