import * as React from 'react';
const { useEffect } = React;
type DependencyList = React.DependencyList;
import {getKeyHandler} from '../../core/ui/lib/KeyHandler';
import {useRenderer} from '../context/RendererContext';

export function useKeyboard(handler: (key: any) => void, deps: DependencyList = []) {
  const renderer = useRenderer();

  useEffect(() => {
    const keyHandler = getKeyHandler();
    keyHandler.on('keypress', handler);

    return () => {
      keyHandler.off('keypress', handler);
    };
  }, deps);
}
