import * as React from 'react';

export interface TextProps {
  x?: number;
  y?: number;
  fg?: string;
  bg?: string;
  bold?: boolean;
  underline?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  dim?: boolean;
  blink?: boolean;
  inverse?: boolean;
  visible?: boolean;
  zIndex?: number;
  children: string;
}

export const Text: React.FC<TextProps> = (props) => {
  return React.createElement('text', props);
};
