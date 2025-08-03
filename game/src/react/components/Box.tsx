import * as React from 'react';
import type { BorderStyle } from '../../core/ui/lib/border';

export interface BoxProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  bg?: string;
  borderStyle?: BorderStyle;
  borderColor?: string;
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  visible?: boolean;
  zIndex?: number;
  children?: React.ReactNode;
}

export const Box: React.FC<BoxProps> = (props) => {
  return React.createElement('box', props);
};
