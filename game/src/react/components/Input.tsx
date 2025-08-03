import * as React from 'react';
import type { BorderStyle } from '../../core/ui/lib/border';

export interface InputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  placeholderColor?: string;
  maxLength?: number;
  focused?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  bg?: string;
  textColor?: string;
  fg?: string;
  borderStyle?: BorderStyle;
  borderColor?: string;
  focusedBorderColor?: string;
  cursorColor?: string;
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  visible?: boolean;
  zIndex?: number;
}

export const Input: React.FC<InputProps> = (props) => {
  return React.createElement('input', props);
};
