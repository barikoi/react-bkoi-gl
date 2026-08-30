/* Browser test helpers, adapted from react-map-gl's test-utils */
/* global setTimeout */
import { act } from 'react-dom/test-utils'

export function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function waitForMapLoad(mapRef: { current: any }) {
  while (!mapRef.current?.isStyleLoaded()) {
    await act(() => sleep(50))
  }
  await act(() => sleep(0))
}

/**
 * Run `updateFunc` (a callback receiving a `resolve`) inside act boundaries,
 * then poll with short act steps until it resolves.
 */
export async function actUntil(updateFunc: (resolve: (value?: unknown) => void) => void) {
  let promise: Promise<unknown>
  await act(() => {
    promise = new Promise(updateFunc)
  })

  let result: unknown
  let error: unknown
  let rejected = false
  let completed = false
  Promise.resolve(promise).then(
    (value) => {
      result = value
      completed = true
    },
    (reason) => {
      error = reason
      rejected = true
      completed = true
    },
  )
  while (!completed) {
    await act(() => sleep(0))
  }
  if (rejected) {
    throw error
  }
  return result
}

/**
 * Poll `cond` inside act boundaries until it returns true.
 * Use for conditions with no event to hook (unlike `actUntil`, which
 * registers a one-shot event listener and never re-runs its callback).
 */
export async function waitFor(cond: () => boolean, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs
  while (!cond()) {
    if (Date.now() > deadline) {
      throw new Error(`waitFor: condition not met within ${timeoutMs}ms`)
    }
    await act(() => sleep(50))
  }
  await act(() => sleep(0))
}

// Minimal offline style: no sources, no layers — no network needed for
// camera/marker/popup tests. For layer/source tests use `geojsonStyle`.
export const emptyStyle = {
  version: 8 as const,
  name: 'react-bkoi-gl-test',
  sources: {},
  layers: [],
}

export const geojsonStyle = {
  version: 8 as const,
  name: 'react-bkoi-gl-test-geojson',
  sources: {
    points: {
      type: 'geojson' as const,
      data: {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'Point' as const, coordinates: [90.3938, 23.8216] },
          },
        ],
      },
    },
  },
  layers: [
    {
      id: 'points-circle',
      type: 'circle' as const,
      source: 'points',
      paint: { 'circle-radius': 8, 'circle-color': '#00ff00' },
    },
  ],
}
