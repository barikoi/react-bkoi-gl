import type { MapLib } from '../types/lib'
import { logger } from './logger'

export type GlobalSettings = {
  /** The maximum number of images (raster tiles, sprites, icons) to load in parallel.
   * @default 16
   */
  maxParallelImageRequests?: number
  /** The map's RTL text plugin. Necessary for supporting the Arabic and Hebrew languages, which are written right-to-left.  */
  RTLTextPlugin?: string | { pluginUrl: string; lazy?: boolean }
  /** The number of web workers instantiated on a page with maplibre-gl maps.
   * @default 2
   */
  workerCount?: number
  /** Provides an interface for loading maplibre-gl's WebWorker bundle from a self-hosted URL.
   * This is useful if your site needs to operate in a strict CSP (Content Security Policy) environment
   * wherein you are not allowed to load JavaScript code from a Blob URL, which is default behavior. */
  workerUrl?: string
}

/**
 * Validates that a URL uses a safe protocol (http/https)
 */
const validateUrl = (url: string, settingName: string): boolean => {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      logger.warn(`${settingName}: Only http/https protocols are allowed, got: ${parsed.protocol}`)
      return false
    }
    return true
  } catch {
    logger.warn(`${settingName}: Invalid URL format: ${url}`)
    return false
  }
}

/**
 * The `mapLib` argument augmented with the module-level global setters it uses.
 * These exist on both mapbox-gl and maplibre-gl but are intentionally omitted
 * from the shared `MapLib` interface, so they are declared optional here and
 * invoked with optional chaining at the call sites.
 */
type GlobalSettingsMapLib = MapLib & {
  getRTLTextPluginStatus?: () => string
  setRTLTextPlugin?: (pluginUrl: string, callback: (error?: Error) => void, lazy: boolean) => void
  setMaxParallelImageRequests?: (count: number) => void
  setWorkerCount?: (count: number) => void
  setWorkerUrl?: (url: string) => void
}

export default function setGlobals(mapLib: GlobalSettingsMapLib, props: GlobalSettings) {
  const { RTLTextPlugin, maxParallelImageRequests, workerCount, workerUrl } = props
  if (
    RTLTextPlugin &&
    mapLib.getRTLTextPluginStatus &&
    mapLib.getRTLTextPluginStatus() === 'unavailable'
  ) {
    const { pluginUrl, lazy = true } =
      typeof RTLTextPlugin === 'string' ? { pluginUrl: RTLTextPlugin } : RTLTextPlugin

    if (validateUrl(pluginUrl, 'RTLTextPlugin')) {
      if (typeof mapLib.setRTLTextPlugin !== 'function') {
        logger.warn(
          `RTLTextPlugin was configured but the provided mapLib does not expose setRTLTextPlugin. Right-to-left scripts (Arabic, Hebrew) will not render correctly.`
        )
      } else {
        mapLib.setRTLTextPlugin(
          pluginUrl,
          (error?: Error) => {
            if (error) {
              logger.error(error)
            }
          },
          lazy
        )
      }
    }
  }
  if (maxParallelImageRequests !== undefined) {
    mapLib.setMaxParallelImageRequests?.(maxParallelImageRequests)
  }
  if (workerCount !== undefined) {
    mapLib.setWorkerCount?.(workerCount)
  }
  if (workerUrl !== undefined) {
    if (validateUrl(workerUrl, 'workerUrl')) {
      mapLib.setWorkerUrl?.(workerUrl)
    }
  }
}
