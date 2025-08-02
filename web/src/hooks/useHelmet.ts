import {useContext} from 'react';
import {helmetContext} from '@client/contexts/HelmetContext';

const useHelmet = (): helmetContextType => {
  return useContext(helmetContext) as helmetContextType;
};

export default useHelmet;
