import * as React from 'react';
import type {StyledTextFragment} from '../../core/styled-text';

export interface StyledTextProps {
  fragment: StyledTextFragment | TemplateStringsArray | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  defaultFg?: string;
  defaultBg?: string;
  visible?: boolean;
  zIndex?: number;
}

export const StyledText: React.FC<StyledTextProps> = (props) => {
  return React.createElement('styledText', props);
};
