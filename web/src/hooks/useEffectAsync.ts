import {useEffect} from 'react';

export function useEffectAsync(effect: () => Promise<void>, deps: any[]) {
  useEffect(() => {
    effect();
  }, deps);
}
