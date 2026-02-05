/**
 * Barikoi MapStyle SDK
 *
 * Predefined map styles for Barikoi Maps.
 * Provides easy access to Barikoi's built-in style URLs.
 *
 * @example
 * ```tsx
 * import { Map, MapStyle } from 'react-bkoi-gl';
 *
 * <Map mapStyle={MapStyle.LIGHT} />
 * ```
 *
 * @see https://docs.barikoi.com/examples/getting-started/display-custom-map-style
 */

/**
 * Barikoi MapStyle constants
 *
 * All styles require an API key. The key can be provided via:
 * - `accessToken` prop on the Map component
 * - Query parameter `?key=YOUR_KEY` appended to the style URL
 */
export const MapStyle = {
  /**
   * Barikoi Light Style
   *
   * Clean, professional style ideal for default, dashboards, and web apps.
   *
   * @example
   * ```tsx
   * <Map mapStyle={MapStyle.LIGHT} />
   * ```
   */
  LIGHT: "https://map.barikoi.com/styles/barikoi-light/style.json",

  /**
   * Barikoi Dark Mode Style
   *
   * Sleek, modern, night-friendly style perfect for admin panels, logistics, and dark UIs.
   *
   * @example
   * ```tsx
   * <Map mapStyle={MapStyle.DARK} />
   * ```
   */
  DARK: "https://map.barikoi.com/styles/barikoi-dark-mode/style.json",

  /**
   * Barikoi Green Style
   *
   * Fresh, nature-inspired style suitable for eco apps, agriculture, and tourism.
   *
   * @example
   * ```tsx
   * <Map mapStyle={MapStyle.GREEN} />
   * ```
   */
  GREEN: "https://map.barikoi.com/styles/barkoi_green/style.json",

  /**
   * Planet Map Style
   *
   * Common, realistic style ideal for real estate and urban planning.
   *
   * @example
   * ```tsx
   * <Map mapStyle={MapStyle.PLANET} />
   * ```
   */
  PLANET: "https://map.barikoi.com/styles/planet_map/style.json",

  /**
   * OpenStreetMap Styles
   */
  OSM: {
    /**
     * OSM Liberty Style
     *
     * OpenStreetMap elegant fork - perfect for open-data lovers and clean minimalism.
     *
     * @example
     * ```tsx
     * <Map mapStyle={MapStyle.OSM.LIBERTY} />
     * ```
     */
    LIBERTY: "https://map.barikoi.com/styles/osm-liberty/style.json",
  },
} as const;

/**
 * Extract the union type of all possible style URLs from MapStyle
 */
export type MapStyleType = (typeof MapStyle)[keyof typeof MapStyle];
