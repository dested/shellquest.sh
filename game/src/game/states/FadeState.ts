import {BaseState} from './BaseState';
import {AuthState} from './AuthState';
import {StyledTextRenderable, t, fg, type ParsedKey, Image} from '../../core';
import {COLORS, GAME_CONFIG} from '../constants';
import {Assets} from '../assets';
import {SplashState} from '@states/SplashState.ts';

export class FadeState extends BaseState {
  handleInput(key: ParsedKey): void {}
  onEnter(): void {
    setTimeout(() => {
      this.stateManager.replace(new SplashState(), {
        type: 'spiral',
        duration: 1000,
      });
    }, 100);
  }

  onExit(): void {}
}
