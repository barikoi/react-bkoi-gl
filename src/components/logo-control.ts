/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import * as React from 'react';
import {useEffect, memo} from 'react';
import {applyReactStyle} from '../utils/apply-react-style';
import {useControl} from './use-control';

import type {ControlPosition, LogoControlOptions} from '../types/lib';

export type LogoControlProps = LogoControlOptions & {
  /** Placement of the control relative to the map. */
  position?: ControlPosition;
  /** CSS style override, applied to the control's container */
  style?: React.CSSProperties;
};

function _LogoControl(props: LogoControlProps) {
  const ctrl = useControl(({mapLib}) => new mapLib.LogoControl(props), {position: props.position});

  useEffect(() => {
    applyReactStyle(ctrl._container, props.style);
    
    // Update the DOM structure and attributes directly
    const logoElement = ctrl._container?.querySelector('.maplibregl-ctrl-logo') as HTMLAnchorElement | null;
    if (logoElement) {
      // Update the link attributes
      logoElement.href = 'https://barikoi.com/';
      logoElement.ariaLabel = 'Barikoi logo';
      logoElement.target = '_blank';
      logoElement.rel = 'noopener nofollow';
      logoElement.style.cursor = 'pointer';
      
      // Remove any existing click handlers
      logoElement.replaceWith(logoElement.cloneNode(true));
    }

  }, [props.style, ctrl._container]);

  return null;
}

export const LogoControl = memo(_LogoControl);
