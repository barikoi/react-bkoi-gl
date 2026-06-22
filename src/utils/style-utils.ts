import type { StyleSpecification } from '../types/style-spec'
import type { ImmutableLike } from '../types/common'

const refProps = ['type', 'source', 'source-layer', 'minzoom', 'maxzoom', 'filter', 'layout']

// Legacy layer type with optional fields not in current type definitions
interface LegacyLayer {
  id: string
  interactive?: boolean
  ref?: string
  [key: string]: unknown
}

// Prepare a map style object for diffing
// If immutable - convert to plain object
// Work around some issues in older styles that would fail Mapbox's diffing
export function normalizeStyle(
  style: string | StyleSpecification | ImmutableLike<StyleSpecification>
): string | StyleSpecification | null {
  if (!style) {
    return null
  }
  if (typeof style === 'string') {
    return style
  }
  if ('toJS' in style) {
    style = style.toJS()
  }
  if (!style.layers) {
    return style
  }
  const layerIndex: Record<string, LegacyLayer> = {}

  for (const layer of style.layers) {
    layerIndex[layer.id] = layer as LegacyLayer
  }

  const layers = style.layers.map(layer => {
    const legacyLayer = layer as LegacyLayer
    let normalizedLayer: LegacyLayer | null = null

    if ('interactive' in legacyLayer) {
      normalizedLayer = Object.assign({}, legacyLayer)
      // Breaks style diffing :(
      delete normalizedLayer.interactive
    }

    // Style diffing doesn't work with refs so expand them out manually before diffing.
    const layerRef = layerIndex[legacyLayer.ref as string]
    if (layerRef) {
      normalizedLayer = normalizedLayer || Object.assign({}, legacyLayer)
      delete normalizedLayer.ref
      // https://github.com/mapbox/mapbox-gl-js/blob/master/src/style-spec/deref.js
      for (const propName of refProps) {
        if (propName in layerRef) {
          normalizedLayer[propName] = layerRef[propName]
        }
      }
    }

    return (normalizedLayer || layer) as typeof layer
  })

  // Do not mutate the style object provided by the user
  return { ...style, layers }
}
