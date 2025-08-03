import * as React from 'react';
const { useState, useCallback } = React;
import {Group, Input, StyledText} from '../components';
import {useKeyboard} from '../hooks';
import { t, bold, fg } from '../../core/styled-text';
import type { BorderStyle } from '../../core/ui/lib/border';

export function InputDemo() {
  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [commentValue, setCommentValue] = useState('');
  const [activeInput, setActiveInput] = useState<'name' | 'email' | 'password' | 'comment'>('name');
  const [lastAction, setLastAction] = useState({
    text: 'Welcome to InputElement demo! Use Tab to navigate between fields.',
    color: '#FFCC00',
  });
  const [borderStyleIndex, setBorderStyleIndex] = useState(0);

  const borderStyles: (BorderStyle | 'none')[] = ['single', 'double', 'rounded', 'heavy', 'none'];
  const currentBorderStyle = borderStyles[borderStyleIndex];

  const validateName = (value: string) => value.length >= 2;
  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validatePassword = (value: string) => value.length >= 6;

  const handleNameChange = useCallback((value: string) => {
    setNameValue(value);
    setLastAction({
      text: `Name input: "${value}"`,
      color: '#00FFFF',
    });
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    setEmailValue(value);
    setLastAction({
      text: `Email input: "${value}"`,
      color: '#00FFFF',
    });
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPasswordValue(value);
    setLastAction({
      text: `Password input: "${value}"`,
      color: '#00FFFF',
    });
  }, []);

  const handleCommentChange = useCallback((value: string) => {
    setCommentValue(value);
    setLastAction({
      text: `Comment input: "${value}"`,
      color: '#00FFFF',
    });
  }, []);

  const handleNameSubmit = useCallback((value: string) => {
    const isValid = validateName(value);
    setLastAction({
      text: `*** Name SUBMITTED: "${value}" ${isValid ? '(Valid)' : '(Invalid)'} ***`,
      color: isValid ? '#00FF00' : '#FF0000',
    });
    setTimeout(() => {
      setLastAction((prev) => ({...prev, color: '#FFCC00'}));
    }, 1500);
  }, []);

  const handleEmailSubmit = useCallback((value: string) => {
    const isValid = validateEmail(value);
    setLastAction({
      text: `*** Email SUBMITTED: "${value}" ${isValid ? '(Valid)' : '(Invalid)'} ***`,
      color: isValid ? '#00FF00' : '#FF0000',
    });
    setTimeout(() => {
      setLastAction((prev) => ({...prev, color: '#FFCC00'}));
    }, 1500);
  }, []);

  const handlePasswordSubmit = useCallback((value: string) => {
    const isValid = validatePassword(value);
    setLastAction({
      text: `*** Password SUBMITTED: "${value}" ${isValid ? '(Valid)' : '(Invalid)'} ***`,
      color: isValid ? '#00FF00' : '#FF0000',
    });
    setTimeout(() => {
      setLastAction((prev) => ({...prev, color: '#FFCC00'}));
    }, 1500);
  }, []);

  const handleCommentSubmit = useCallback((value: string) => {
    setLastAction({
      text: `*** Comment SUBMITTED: "${value}" (Valid) ***`,
      color: '#00FF00',
    });
    setTimeout(() => {
      setLastAction((prev) => ({...prev, color: '#FFCC00'}));
    }, 1500);
  }, []);

  useKeyboard(
    (key) => {
      if (key.name === 'tab') {
        const inputs: Array<'name' | 'email' | 'password' | 'comment'> = [
          'name',
          'email',
          'password',
          'comment',
        ];
        const currentIndex = inputs.indexOf(activeInput);
        let nextIndex: number;

        if (key.shift) {
          nextIndex = (currentIndex - 1 + inputs.length) % inputs.length;
        } else {
          nextIndex = (currentIndex + 1) % inputs.length;
        }

        const nextInput = inputs[nextIndex];
        setActiveInput(nextInput);
        setLastAction({
          text: `Switched to ${nextInput.charAt(0).toUpperCase() + nextInput.slice(1)} input`,
          color: '#FFCC00',
        });
      } else if (key.ctrl && key.name === 'f') {
        // Toggle focus is handled by focused prop change
        const inputName = activeInput.charAt(0).toUpperCase() + activeInput.slice(1);
        setLastAction({
          text: `${inputName} input focus toggled`,
          color: '#FFCC00',
        });
      } else if (key.ctrl && key.name === 'c') {
        // Clear active input
        switch (activeInput) {
          case 'name':
            setNameValue('');
            break;
          case 'email':
            setEmailValue('');
            break;
          case 'password':
            setPasswordValue('');
            break;
          case 'comment':
            setCommentValue('');
            break;
        }
        const inputName = activeInput.charAt(0).toUpperCase() + activeInput.slice(1);
        setLastAction({
          text: `${inputName} input cleared`,
          color: '#FFAA00',
        });
      } else if (key.ctrl && key.name === 'b') {
        // Cycle border styles
        setBorderStyleIndex((prev) => (prev + 1) % borderStyles.length);
        setLastAction({
          text: `Border style changed`,
          color: '#FFCC00',
        });
      } else if (key.ctrl && key.name === 'r') {
        // Reset all inputs
        setNameValue('');
        setEmailValue('');
        setPasswordValue('');
        setCommentValue('');
        setLastAction({
          text: 'All inputs reset to empty values',
          color: '#FF00FF',
        });
        setTimeout(() => {
          setLastAction((prev) => ({...prev, color: '#FFCC00'}));
        }, 1000);
      }
    },
    [activeInput, nameValue, emailValue, passwordValue, commentValue],
  );

  const nameStatus = activeInput === 'name' ? 'FOCUSED' : 'BLURRED';
  const nameStatusColor = activeInput === 'name' ? '#00FF00' : '#FF0000';

  const emailStatus = activeInput === 'email' ? 'FOCUSED' : 'BLURRED';
  const emailStatusColor = activeInput === 'email' ? '#00FF00' : '#FF0000';

  const passwordStatus = activeInput === 'password' ? 'FOCUSED' : 'BLURRED';
  const passwordStatusColor = activeInput === 'password' ? '#00FF00' : '#FF0000';

  const commentStatus = activeInput === 'comment' ? 'FOCUSED' : 'BLURRED';
  const commentStatusColor = activeInput === 'comment' ? '#00FF00' : '#FF0000';

  const keyLegendFragment = t`${bold(fg('#FFFFFF')('Key Controls:'))}
Tab/Shift+Tab: Navigate between inputs
Left/Right: Move cursor within input
Home/End: Move to start/end of input
Backspace/Delete: Remove characters
Enter: Submit current input
Ctrl+F: Toggle focus on active input
Ctrl+C: Clear active input
Ctrl+R: Reset all inputs to defaults
Ctrl+B: Cycle border styles
Type: Enter text in focused field`;

  const statusFragment = t`${bold(fg('#FFFFFF')('Input Values:'))}
Name: "${nameValue}" (${fg(nameStatusColor)(nameStatus)})
Email: "${emailValue}" (${fg(emailStatusColor)(emailStatus)})
Password: "${passwordValue.replace(/./g, '*')}" (${fg(passwordStatusColor)(passwordStatus)})
Comment: "${commentValue}" (${fg(commentStatusColor)(commentStatus)})

${bold(fg('#FFAA00')(`Active Input: ${activeInput.charAt(0).toUpperCase() + activeInput.slice(1)}`))}

${bold(fg('#CCCCCC')('Validation:'))}
Name: ${validateName(nameValue) ? fg('#00FF00')('✓ Valid') : fg('#FF0000')('✗ Invalid (min 2 chars)')}
Email: ${validateEmail(emailValue) ? fg('#00FF00')('✓ Valid') : fg('#FF0000')('✗ Invalid format')}
Password: ${validatePassword(passwordValue) ? fg('#00FF00')('✓ Valid') : fg('#FF0000')('✗ Invalid (min 6 chars)')}

${fg(lastAction.color)(lastAction.text)}`;

  return (
    <Group x={0} y={0}>
      <Input
        x={5}
        y={2}
        width={40}
        height={3}
        value={nameValue}
        onChange={handleNameChange}
        onSubmit={handleNameSubmit}
        focused={activeInput === 'name'}
        placeholder='Enter your name...'
        placeholderColor='#666666'
        backgroundColor='#001122'
        textColor='#FFFFFF'
        borderStyle={currentBorderStyle === 'none' ? undefined : currentBorderStyle}
        borderColor='#666666'
        focusedBorderColor='#00AAFF'
        cursorColor='#FFFF00'
        maxLength={50}
        title='Name'
        titleAlignment='left'
      />

      <Input
        x={5}
        y={6}
        width={40}
        height={3}
        value={emailValue}
        onChange={handleEmailChange}
        onSubmit={handleEmailSubmit}
        focused={activeInput === 'email'}
        placeholder='Enter your email...'
        placeholderColor='#666666'
        backgroundColor='#001122'
        textColor='#FFFFFF'
        borderStyle={currentBorderStyle === 'none' ? undefined : currentBorderStyle}
        borderColor='#666666'
        focusedBorderColor='#00AAFF'
        cursorColor='#FFFF00'
        maxLength={100}
        title='Email'
        titleAlignment='left'
      />

      <Input
        x={5}
        y={10}
        width={40}
        height={3}
        value={passwordValue}
        onChange={handlePasswordChange}
        onSubmit={handlePasswordSubmit}
        focused={activeInput === 'password'}
        placeholder='Enter password...'
        placeholderColor='#666666'
        backgroundColor='#001122'
        textColor='#FFFFFF'
        borderStyle={currentBorderStyle === 'none' ? undefined : currentBorderStyle}
        borderColor='#666666'
        focusedBorderColor='#00AAFF'
        cursorColor='#FFFF00'
        maxLength={50}
        title='Password'
        titleAlignment='left'
      />

      <Input
        x={5}
        y={14}
        width={60}
        height={3}
        value={commentValue}
        onChange={handleCommentChange}
        onSubmit={handleCommentSubmit}
        focused={activeInput === 'comment'}
        placeholder='Enter a comment...'
        placeholderColor='#666666'
        backgroundColor='#001122'
        textColor='#FFFFFF'
        borderStyle={currentBorderStyle === 'none' ? undefined : currentBorderStyle}
        borderColor='#666666'
        focusedBorderColor='#00AAFF'
        cursorColor='#FFFF00'
        maxLength={200}
        title='Comment'
        titleAlignment='left'
      />

      <StyledText
        x={50}
        y={2}
        width={50}
        height={12}
        fragment={keyLegendFragment}
        defaultFg='#AAAAAA'
      />

      <StyledText x={5} y={19} width={80} height={18} fragment={statusFragment} />
    </Group>
  );
}
