import * as React from 'react';
const { createContext, useContext } = React;
import type {CliRenderer} from '../../core';

export interface RendererContextValue {
  renderer: CliRenderer;
}

const RendererContext = createContext<RendererContextValue | null>(null);

export interface RendererProviderProps {
  renderer: CliRenderer;
  children: React.ReactNode;
}

export const RendererProvider: React.FC<RendererProviderProps> = ({renderer, children}) => {
  return React.createElement(
    RendererContext.Provider,
    { value: { renderer } },
    children
  );
};

export function useRenderer(): CliRenderer {
  const context = useContext(RendererContext);
  if (!context) {
    throw new Error('useRenderer must be used within RendererProvider');
  }
  return context.renderer;
}
