/**
 * CRA + Jest resolution proof.
 *
 * Since v3.2 the engine ships bundled inside the published package (es2020 —
 * react-scripts 5's frozen babel can parse it), so unit tests can import the
 * real library: `src/setupTests.js` polyfills TextDecoder, the one Web API
 * jsdom lacks that engine module scope needs. NOTE: the old
 * `jest.mock('maplibre-gl', …, { virtual: true })` pattern is a no-op now —
 * there is no bare 'maplibre-gl' specifier left to intercept; mock
 * `react-bkoi-gl` itself instead. Real rendering stays covered by the
 * production build (`react-scripts build`) + a browser.
 *
 * This suite proves what Jest CAN guarantee: `react-bkoi-gl` resolves through
 * package.json `main`, executes, and exposes the documented exports.
 */
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
