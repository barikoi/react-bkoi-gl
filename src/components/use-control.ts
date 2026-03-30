import { useContext, useMemo, useEffect } from 'react'
import type { IControl, ControlPosition, MapControl } from '../types/lib'
import { MapContext } from './map'
import type { MapContextValue } from './map'

type ControlOptions = {
  position?: ControlPosition
}

export function useControl<T extends MapControl>(
  onCreate: (context: MapContextValue) => T,
  opts?: ControlOptions
): T

export function useControl<T extends MapControl>(
  onCreate: (context: MapContextValue) => T,
  onRemove: (context: MapContextValue) => void,
  opts?: ControlOptions
): T

export function useControl<T extends MapControl>(
  onCreate: (context: MapContextValue) => T,
  onAdd: (context: MapContextValue) => void,
  onRemove: (context: MapContextValue) => void,
  opts?: ControlOptions
): T

export function useControl<T extends MapControl>(
  onCreate: (context: MapContextValue) => T,
  arg1?: ((context: MapContextValue) => void) | ControlOptions,
  arg2?: ((context: MapContextValue) => void) | ControlOptions,
  arg3?: ControlOptions
): T {
  const context = useContext(MapContext)

  if (!context) {
    throw new Error('useControl must be used within a Map component')
  }

  const ctrl = useMemo(() => onCreate(context), [])

  useEffect(() => {
    const opts = (arg3 || arg2 || arg1) as ControlOptions
    const onAdd = typeof arg1 === 'function' && typeof arg2 === 'function' ? arg1 : null
    const onRemove = typeof arg2 === 'function' ? arg2 : typeof arg1 === 'function' ? arg1 : null

    const { map } = context
    const ctrlAsIControl = ctrl as unknown as IControl
    if (!map.hasControl(ctrlAsIControl)) {
      map.addControl(ctrlAsIControl, opts?.position)
      if (onAdd) {
        onAdd(context)
      }
    }

    return () => {
      if (onRemove) {
        onRemove(context)
      }
      // Map might have been removed (parent effects are destroyed before child ones)
      if (map.hasControl(ctrlAsIControl)) {
        map.removeControl(ctrlAsIControl)
      }
    }
  }, [])

  return ctrl
}
