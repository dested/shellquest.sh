import * as React from 'react';
import type { BorderStyle } from '../../core/ui/lib/border';
import type { SelectOption } from '../../core/ui/elements/select';

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string, option: SelectOption) => void;
  onSelect?: (value: string, option: SelectOption) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  focused?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  bg?: string;
  selectedBackgroundColor?: string;
  selectedTextColor?: string;
  textColor?: string;
  fg?: string;
  selectedDescriptionColor?: string;
  descriptionColor?: string;
  borderStyle?: BorderStyle;
  borderColor?: string;
  focusedBorderColor?: string;
  showDescription?: boolean;
  showScrollIndicator?: boolean;
  wrapSelection?: boolean;
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  fastScrollStep?: number;
  visible?: boolean;
  zIndex?: number;
}

export const Select: React.FC<SelectProps> = (props) => {
  return React.createElement('select', props);
};
