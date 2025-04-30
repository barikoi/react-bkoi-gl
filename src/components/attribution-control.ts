/* eslint-disable max-statements */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import * as React from 'react';
import {useEffect, memo} from 'react';
import {applyReactStyle} from '../utils/apply-react-style';
import {useControl} from './use-control';

import type {ControlPosition, AttributionControlOptions} from '../types/lib';

export type AttributionControlProps = AttributionControlOptions & {
  /** Placement of the control relative to the map. */
  position?: ControlPosition;
  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties;
};

function _AttributionControl(props: AttributionControlProps) {
  const ctrl = useControl(({mapLib}) => new mapLib.AttributionControl(props), { position: props.position });

  useEffect(() => {
    applyReactStyle(ctrl._container, props.style);

    // Ensure the container is available
    if (!ctrl._container) return;

    // Create and append the custom attribution control
    // const customAttribution = document.createElement('details');
    // customAttribution.className = 'maplibregl-ctrl maplibregl-ctrl-attrib maplibregl-compact maplibregl-compact-show';
    // customAttribution.setAttribute('open', '');

    // const summary = document.createElement('summary');
    // summary.className = 'maplibregl-ctrl-attrib-button';
    // summary.setAttribute('title', 'Toggle attribution');
    // summary.setAttribute('aria-label', 'Toggle attribution');
    // customAttribution.appendChild(summary);

    // const innerDiv = document.createElement('div');
    // innerDiv.className = 'maplibregl-ctrl-attrib-inner';
    // innerDiv.innerHTML = `
    //   <a href="https://barikoi.com/" target="_blank">© Barikoi</a> | 
    //   <a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> | 
    //   <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>
    // `;
    // customAttribution.appendChild(innerDiv);

    // ctrl._container.appendChild(customAttribution);

  }, [props.style, ctrl._container]);

  return null;
}

export const AttributionControl = memo(_AttributionControl);
