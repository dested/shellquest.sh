import * as React from 'react';
const { useEffect } = React;
type DependencyList = React.DependencyList;
import {useRenderer} from '../context/RendererContext';

export function useAnimation(callback: (deltaTime: number) => void, deps: DependencyList = []) {
  const renderer = useRenderer();

  useEffect(() => {
    const frameCallback = async (deltaTime: number) => {
      callback(deltaTime);
    };

    renderer.setFrameCallback(frameCallback);

    return () => {
      renderer.removeFrameCallback(frameCallback);
    };
  }, deps);
}
