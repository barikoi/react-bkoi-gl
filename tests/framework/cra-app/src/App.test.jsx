/**
 * CRA + Jest resolution proof.
 *
 * react-scripts 5's frozen babel cannot parse maplibre-gl v6's ES2022 syntax
 * (static class blocks), and jest cannot resolve the engine's exports-only
 * package. The standard pattern for WebGL components is to mock the library
 * in unit tests; real rendering is covered by the production build
 * (`react-scripts build`) + a browser.
 *
 * This suite proves what Jest CAN guarantee: `react-bkoi-gl` resolves through
 * package.json `main`, executes, and exposes the documented exports — with
 * the engine virtual-mocked so its syntax never hits babel.
 */
jest.mock(
  'maplibre-gl',
  () => ({
    Map: function Map() {},
    setWorkerUrl: jest.fn(),
    getWorkerUrl: jest.fn(() => ''),
    getVersion: jest.fn(() => '0.0.0'),
    GPUInitializationError: class GPUInitializationError extends Error {},
  }),
  { virtual: true }
)

import * as lib from 'react-bkoi-gl'

test('react-bkoi-gl resolves under Jest and exposes the documented exports', () => {
  for (const name of ['Map', 'Marker', 'Popup', 'Source', 'Layer', 'NavigationControl']) {
    expect(lib[name]).toBeTruthy()
  }
  expect(typeof lib.setWorkerUrl).toBe('function')
  expect(typeof lib.setLogger).toBe('function')
  expect(typeof lib.useMap).toBe('function')
  expect(typeof lib.useControl).toBe('function')
})
