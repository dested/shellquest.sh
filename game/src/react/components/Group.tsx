import * as React from 'react';

export interface GroupProps {
  x?: number;
  y?: number;
  visible?: boolean;
  zIndex?: number;
  children?: React.ReactNode;
}

export const Group: React.FC<GroupProps> = (props) => {
  return React.createElement('group', props);
};
