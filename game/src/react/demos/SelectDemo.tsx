import * as React from 'react';
const { useState, useCallback } = React;
import {Group, Select, StyledText} from '../components';
import {useKeyboard} from '../hooks';
import { t, bold, fg } from '../../core/styled-text';
import type { BorderStyle } from '../../core/ui/lib/border';
import type { SelectOption } from '../../core/ui/elements/select';

export function SelectDemo() {
  const [selectedValue, setSelectedValue] = useState('home');
  const [focused, setFocused] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [wrapSelection, setWrapSelection] = useState(false);
  const [borderStyleIndex, setBorderStyleIndex] = useState(0);
  const [lastAction, setLastAction] = useState({
    text: 'Welcome to SelectElement demo! Use the controls to test features.',
    color: '#FFCC00',
  });

  const borderStyles: (BorderStyle | 'none')[] = ['single', 'double', 'rounded', 'heavy', 'none'];
  const currentBorderStyle = borderStyles[borderStyleIndex];

  const selectOptions: SelectOption[] = [
    {name: 'Home', description: 'Navigate to the home page', value: 'home'},
    {name: 'Profile', description: 'View and edit your user profile', value: 'profile'},
    {name: 'Settings', description: 'Configure application preferences', value: 'settings'},
    {name: 'Dashboard', description: 'View analytics and key metrics', value: 'dashboard'},
    {name: 'Projects', description: 'Manage your active projects', value: 'projects'},
    {name: 'Reports', description: 'Generate and view detailed reports', value: 'reports'},
    {name: 'Users', description: 'Manage user accounts and permissions', value: 'users'},
    {name: 'Analytics', description: 'Deep dive into usage analytics', value: 'analytics'},
    {name: 'Tools', description: 'Access various utility tools', value: 'tools'},
    {name: 'API Documentation', description: 'Browse API endpoints and examples', value: 'api'},
    {name: 'Help Center', description: 'Find answers to common questions', value: 'help'},
    {name: 'Support', description: 'Contact our support team', value: 'support'},
    {name: 'Billing', description: 'Manage your subscription and billing', value: 'billing'},
    {name: 'Integrations', description: 'Connect with third-party services', value: 'integrations'},
    {name: 'Security', description: 'Configure security settings', value: 'security'},
    {
      name: 'Notifications',
      description: 'Manage your notification preferences',
      value: 'notifications',
    },
    {name: 'Backup', description: 'Backup and restore your data', value: 'backup'},
    {name: 'Import/Export', description: 'Import or export your data', value: 'import-export'},
    {name: 'Advanced Settings', description: 'Configure advanced options', value: 'advanced'},
    {name: 'About', description: 'Learn more about this application', value: 'about'},
  ];

  const currentOption = selectOptions.find((opt) => opt.value === selectedValue);
  const currentIndex = selectOptions.findIndex((opt) => opt.value === selectedValue);

  const handleChange = useCallback((value: string, option: SelectOption) => {
    setSelectedValue(value);
    setLastAction({
      text: `Navigation: Moved to "${option.name}"`,
      color: '#FFCC00',
    });
  }, []);

  const handleSelect = useCallback((value: string, option: SelectOption) => {
    setLastAction({
      text: `*** ACTIVATED: ${option.name} (${option.value}) ***`,
      color: '#FF00FF',
    });
    setTimeout(() => {
      setLastAction((prev) => ({...prev, color: '#FFCC00'}));
    }, 1000);
  }, []);

  useKeyboard(
    (key) => {
      if (key.name === 'f') {
        setFocused((prev) => !prev);
        setLastAction({
          text: focused ? 'Focus removed from select element' : 'Select element focused',
          color: '#FFCC00',
        });
      } else if (key.name === 'd') {
        setShowDescription((prev) => !prev);
        setLastAction({
          text: `Descriptions ${!showDescription ? 'enabled' : 'disabled'}`,
          color: '#FFCC00',
        });
      } else if (key.name === 'b') {
        setBorderStyleIndex((prev) => (prev + 1) % borderStyles.length);
        const nextStyle = borderStyles[(borderStyleIndex + 1) % borderStyles.length];
        setLastAction({
          text: `Border style changed to ${nextStyle}`,
          color: '#FFCC00',
        });
      } else if (key.name === 's') {
        setShowScrollIndicator((prev) => !prev);
        setLastAction({
          text: `Scroll indicator ${!showScrollIndicator ? 'enabled' : 'disabled'}`,
          color: '#FFCC00',
        });
      } else if (key.name === 'w') {
        setWrapSelection((prev) => !prev);
        setLastAction({
          text: `Wrap selection ${!wrapSelection ? 'enabled' : 'disabled'}`,
          color: '#FFCC00',
        });
      }
    },
    [focused, showDescription, showScrollIndicator, wrapSelection, borderStyleIndex],
  );

  const keyLegendFragment = t`${bold(fg('#FFFFFF')('Key Controls:'))}
↑/↓ or j/k: Navigate items
Shift+↑/↓ or Shift+j/k: Fast scroll
Enter: Select item
F: Toggle focus
D: Toggle descriptions
B: Cycle border styles
S: Toggle scroll indicator
W: Toggle wrap selection`;

  const selectionText = currentOption
    ? `Selection: ${currentOption.name} (${currentOption.value}) - Index: ${currentIndex}`
    : 'No selection';

  const focusText = focused ? 'Select element is FOCUSED' : 'Select element is BLURRED';
  const focusColor = focused ? '#00FF00' : '#FF0000';

  const statusFragment = t`${fg('#00FF00')(selectionText)}

${fg(focusColor)(focusText)}

${fg('#CCCCCC')(`Border: ${currentBorderStyle} | Scroll indicator: ${showScrollIndicator ? 'on' : 'off'} | Description: ${showDescription ? 'on' : 'off'} | Wrap: ${wrapSelection ? 'on' : 'off'}`)}

${fg(lastAction.color)(lastAction.text)}`;

  return (
    <Group x={0} y={0}>
      <Select
        x={5}
        y={2}
        width={50}
        height={20}
        options={selectOptions}
        value={selectedValue}
        onChange={handleChange}
        onSelect={handleSelect}
        focused={focused}
        backgroundColor='#001122'
        selectedBackgroundColor='#334455'
        selectedTextColor='#FFFF00'
        textColor='#CCCCCC'
        selectedDescriptionColor='#FFFFFF'
        descriptionColor='#888888'
        borderStyle={currentBorderStyle === 'none' ? undefined : currentBorderStyle}
        borderColor='#666666'
        focusedBorderColor='#00AAFF'
        showDescription={showDescription}
        showScrollIndicator={showScrollIndicator}
        wrapSelection={wrapSelection}
        title='Menu Options'
        titleAlignment='center'
        fastScrollStep={5}
      />

      <StyledText
        x={60}
        y={3}
        width={40}
        height={9}
        fragment={keyLegendFragment}
        defaultFg='#AAAAAA'
      />

      <StyledText x={5} y={24} width={80} height={8} fragment={statusFragment} />
    </Group>
  );
}
