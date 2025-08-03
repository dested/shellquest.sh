import * as React from 'react';
const { useState, useCallback } = React;
import {Group, Box, Text} from '../components';
import {useAnimation, useKeyboard} from '../hooks';

export function AnimationDemo() {
  const [animationTime, setAnimationTime] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(4000);

  // Parent A position (circular motion)
  const [parentAX, setParentAX] = useState(10);
  const [parentAY, setParentAY] = useState(5);

  // Parent B position (vertical motion)
  const [parentBY, setParentBY] = useState(8);

  useAnimation(
    (deltaMs) => {
      setAnimationTime((prev) => {
        const newTime = prev + deltaMs;

        // Update Parent A position (circular motion)
        const circleRadius = 15;
        const circleSpeed = (newTime / animationSpeed) * Math.PI * 2;
        const newParentAX = 20 + Math.cos(circleSpeed) * circleRadius;
        const newParentAY = 8 + (Math.sin(circleSpeed) * circleRadius) / 2;
        setParentAX(Math.round(newParentAX));
        setParentAY(Math.round(newParentAY));

        // Update Parent B position (vertical motion)
        const verticalSpeed = (newTime / (animationSpeed * 1.5)) * Math.PI * 2;
        const newParentBY = 8 + Math.sin(verticalSpeed) * 8;
        setParentBY(Math.round(newParentBY));

        return newTime;
      });
    },
    [animationSpeed],
  );

  useKeyboard(
    useCallback((key) => {
      const keyStr = key.toString();

      if (keyStr === '+' || keyStr === '=') {
        setAnimationSpeed((prev) => Math.max(500, prev - 300));
      } else if (keyStr === '-' || keyStr === '_') {
        setAnimationSpeed((prev) => Math.min(8000, prev + 300));
      }
    }, []),
    [],
  );

  // Calculate absolute position for display
  const absoluteChildA1X = parentAX + 2;
  const absoluteChildA1Y = parentAY + 3;

  return (
    <Group x={0} y={0}>
      <Text x={5} y={1} fg='#FFFF00' bold underline>
        Relative Positioning Demo - Child positions are relative to parent
      </Text>

      {/* Moving Parent Container A */}
      <Group x={parentAX} y={parentAY}>
        <Box
          x={0}
          y={0}
          width={30}
          height={12}
          bg='#220044'
          borderStyle='double'
          borderColor='#FF44FF'
          title='Parent A (moves in circle)'
          titleAlignment='center'
        />

        <Text x={2} y={1} fg='#FF44FF' bold>
          {`Parent A Position: (${parentAX}, ${parentAY})`}
        </Text>

        {/* Child objects in Parent A */}
        <Box
          x={2}
          y={3}
          width={8}
          height={3}
          bg='#440066'
          borderStyle='single'
          borderColor='#FF88FF'
          title={`Child (2,3) -> Abs(${absoluteChildA1X},${absoluteChildA1Y})`}
          titleAlignment='center'
        />

        <Box
          x={12}
          y={3}
          width={8}
          height={3}
          bg='#660044'
          borderStyle='single'
          borderColor='#FF88FF'
          title='Child (12,3)'
          titleAlignment='center'
        />

        <Box
          x={7}
          y={7}
          width={8}
          height={3}
          bg='#440044'
          borderStyle='single'
          borderColor='#FF88FF'
          title='Child (7,7)'
          titleAlignment='center'
        />
      </Group>

      {/* Moving Parent Container B */}
      <Group x={50} y={parentBY}>
        <Box
          x={0}
          y={0}
          width={40}
          height={10}
          bg='#004422'
          borderStyle='rounded'
          borderColor='#44FF44'
          title='Parent B (moves vertically)'
          titleAlignment='center'
        />

        <Text x={2} y={1} fg='#44FF44' bold>
          {`Parent B Position: (50, ${parentBY})`}
        </Text>

        {/* Child objects in Parent B */}
        <Text x={1} y={3} fg='#88FF88'>
          Child at (1,3) - relative to parent
        </Text>

        <Text x={1} y={5} fg='#88FF88'>
          Child at (1,5) - relative to parent
        </Text>
      </Group>

      {/* Static Container */}
      <Group x={5} y={20}>
        <Box
          x={0}
          y={0}
          width={40}
          height={8}
          bg='#442200'
          borderStyle='single'
          borderColor='#FFFF44'
          title="Static Parent (doesn't move)"
          titleAlignment='center'
        />

        <Text x={2} y={2} fg='#FFFF88'>
          Static child at (2,2) - never moves
        </Text>

        <Text x={2} y={4} fg='#FFFF88'>
          Static child at (2,4) - never moves
        </Text>
      </Group>

      {/* Explanations */}
      <Text x={5} y={30} fg='#AAAAAA' bold>
        Key Concept: Child object coordinates are RELATIVE to their parent's position
      </Text>

      <Text x={5} y={31} fg='#AAAAAA'>
        When parent moves, children move with it while keeping their relative positions
      </Text>

      <Text x={5} y={32} fg='#AAAAAA'>
        Child at (2,3) in a parent at (10,5) appears at screen position (12,8)
      </Text>

      <Text x={5} y={34} fg='#FFFFFF' bold>
        Controls: +/- to change animation speed
      </Text>

      <Text x={5} y={35} fg='#CCCCCC'>
        {`Animation Speed: ${animationSpeed}ms (min: 500, max: 8000)`}
      </Text>
    </Group>
  );
}
