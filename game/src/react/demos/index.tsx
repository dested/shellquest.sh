import * as React from 'react';
const { useState } = React;
import {createReactApp} from '../index';
import {InputDemo} from './InputDemo';
import {SelectDemo} from './SelectDemo';
import {AnimationDemo} from './AnimationDemo';
import {Group, Text, Box} from '../components';
import {useKeyboard} from '../hooks';

// Main app that combines all demos
function App() {
  const [activeDemo, setActiveDemo] = useState<'input' | 'select' | 'animation'>('input');
  const [showMenu, setShowMenu] = useState(false);

  useKeyboard(
    (key) => {
      // ESC to toggle menu
      if (key.name === 'escape') {
        setShowMenu((prev) => !prev);
      }

      // Number keys to switch demos when menu is shown
      if (showMenu) {
        if (key.name === '1') {
          setActiveDemo('input');
          setShowMenu(false);
        } else if (key.name === '2') {
          setActiveDemo('select');
          setShowMenu(false);
        } else if (key.name === '3') {
          setActiveDemo('animation');
          setShowMenu(false);
        }
      }
    },
    [showMenu],
  );

  return (
    <>
      {/* Demo content */}
      {!showMenu && (
        <>
          {activeDemo === 'input' && <InputDemo />}
          {activeDemo === 'select' && <SelectDemo />}
          {activeDemo === 'animation' && <AnimationDemo />}
        </>
      )}

      {/* Menu overlay */}
      {showMenu && (
        <Group x={0} y={0}>
          <Box
            x={20}
            y={10}
            width={40}
            height={12}
            bg='#000033'
            borderStyle='double'
            borderColor='#00FFFF'
            title='Demo Selection Menu'
            titleAlignment='center'
          />

          <Text x={22} y={12} fg='#FFFFFF' bold>
            Select a demo:
          </Text>

          <Text x={22} y={14} fg={activeDemo === 'input' ? '#00FF00' : '#CCCCCC'}>
            1. Input Demo {activeDemo === 'input' && '(current)'}
          </Text>

          <Text x={22} y={15} fg={activeDemo === 'select' ? '#00FF00' : '#CCCCCC'}>
            2. Select Demo {activeDemo === 'select' && '(current)'}
          </Text>

          <Text x={22} y={16} fg={activeDemo === 'animation' ? '#00FF00' : '#CCCCCC'}>
            3. Animation Demo {activeDemo === 'animation' && '(current)'}
          </Text>

          <Text x={22} y={18} fg='#888888'>
            Press ESC to close menu
          </Text>
        </Group>
      )}

      {/* Help text at bottom */}
      {!showMenu && (
        <Text x={2} y={38} fg='#666666'>
          Press ESC to open demo menu
        </Text>
      )}
    </>
  );
}

// Entry point to run the React app
if (import.meta.main) {
  createReactApp(App, {
    exitOnCtrlC: true,
    targetFps: 30,
  })
    .then(() => {
      console.log('React Terminal App started');
    })
    .catch((err) => {
      console.error('Failed to start React app:', err);
      process.exit(1);
    });
}

export {App};
