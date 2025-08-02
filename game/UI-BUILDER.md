# OpenTUI UI Builder Guide

## Overview
OpenTUI provides a rich set of UI components and rendering capabilities for building sophisticated terminal user interfaces. This guide will help you understand and utilize the full power of the OpenTUI engine.

## ⚠️ Important Buffer/Drawing API Notes
When working with OpenTUI buffers and drawing:
1. **Create buffers using**: `renderer.lib.createOptimizedBuffer(width, height, respectAlpha)`
2. **Access buffer via**: `frameBufferRenderable.frameBuffer` (NOT `.buffer`)
3. **Draw to buffer using**: `buffer.setCell(x, y, char, fgColor, bgColor)` (NOT `setPixel`)
4. **Colors must be RGBA objects**: Use `RGBA.fromHex()`, `RGBA.fromInts()`, or `RGBA.fromValues()`
5. **Clear buffers with**: `buffer.clear()` or `buffer.clear(bgColor)`

## Core Concepts

### 1. Renderer System
The `CliRenderer` is your main interface for creating UI elements. It manages the render loop, handles input, and coordinates all visual elements.

```typescript
import { createCliRenderer, CliRenderer } from '../core';

const renderer = createCliRenderer({
  targetFps: 30,
  useMouse: true,
  enableMouseMovement: true
});
```

### 2. Renderables
Everything visual in OpenTUI is a `Renderable`. This includes:
- `GroupRenderable` - Container for organizing other renderables
- `FrameBufferRenderable` - For pixel-perfect drawing
- `StyledTextRenderable` - Rich text with color and formatting
- UI Elements (Input, Select, TabSelect, etc.)

## UI Components

### InputElement
A fully-featured text input field with borders, placeholders, and validation.

```typescript
import { InputElement, InputElementEvents } from '../core';

const input = new InputElement('my-input', {
  x: 5,
  y: 10,
  width: 40,
  height: 3,
  zIndex: 100,
  backgroundColor: '#001122',
  textColor: '#FFFFFF',
  borderStyle: 'rounded',  // 'single', 'double', 'rounded', 'heavy'
  borderColor: '#666666',
  focusedBorderColor: '#00AAFF',
  placeholder: 'Enter text...',
  placeholderColor: '#666666',
  cursorColor: '#FFFF00',
  maxLength: 50,
  title: 'Username',
  titleAlignment: 'left'  // 'left', 'center', 'right'
});

// Event handling
input.on(InputElementEvents.INPUT, (value: string) => {
  // Called on every keystroke
});

input.on(InputElementEvents.CHANGE, (value: string) => {
  // Called when input loses focus or Enter is pressed
});

input.on(InputElementEvents.ENTER, (value: string) => {
  // Called when Enter is pressed
});

input.on(InputElementEvents.FOCUSED, () => {
  // Input gained focus
});

input.on(InputElementEvents.BLURRED, () => {
  // Input lost focus
});

// Methods
input.focus();
input.blur();
input.setValue('text');
input.getValue();
input.clear();
input.isFocused();
```

### SelectElement
A scrollable list selector with descriptions and keyboard navigation.

```typescript
import { SelectElement, SelectElementEvents, SelectOption } from '../core';

const options: SelectOption[] = [
  { name: 'Option 1', description: 'First option', value: 'opt1' },
  { name: 'Option 2', description: 'Second option', value: 'opt2' }
];

const select = new SelectElement('my-select', {
  x: 5,
  y: 5,
  width: 50,
  height: 20,
  options: options,
  backgroundColor: '#001122',
  selectedBackgroundColor: '#334455',
  selectedTextColor: '#FFFF00',
  textColor: '#CCCCCC',
  selectedDescriptionColor: '#FFFFFF',
  descriptionColor: '#888888',
  borderStyle: 'single',
  borderColor: '#666666',
  focusedBorderColor: '#00AAFF',
  showDescription: true,
  showScrollIndicator: true,
  wrapSelection: false,
  title: 'Select an Option',
  titleAlignment: 'center',
  fastScrollStep: 5
});

// Event handling
select.on(SelectElementEvents.SELECTION_CHANGED, (index: number, option: SelectOption) => {
  // User navigated to a different option
});

select.on(SelectElementEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
  // User pressed Enter on an option
});

// Methods
select.focus();
select.blur();
select.selectIndex(0);
select.selectNext();
select.selectPrevious();
select.getSelectedOption();
select.getSelectedIndex();
```

### TabSelectElement
Horizontal tab selector for navigation between sections.

```typescript
import { TabSelectElement, TabSelectElementEvents, TabSelectOption } from '../core';

const tabs: TabSelectOption[] = [
  { name: 'Home', description: 'Home page', value: 'home' },
  { name: 'Profile', description: 'User profile', value: 'profile' }
];

const tabSelect = new TabSelectElement('my-tabs', {
  x: 5,
  y: 2,
  width: 70,
  options: tabs,
  tabWidth: 12,
  selectedBackgroundColor: '#334455',
  selectedTextColor: '#FFFF00',
  textColor: '#CCCCCC',
  selectedDescriptionColor: '#FFFFFF',
  borderStyle: 'single',
  borderColor: '#666666',
  focusedBorderColor: '#00AAFF',
  showDescription: true,
  showUnderline: true,
  showScrollArrows: true,
  wrapSelection: false
});

// Event handling similar to SelectElement
tabSelect.on(TabSelectElementEvents.SELECTION_CHANGED, (index, option) => {});
tabSelect.on(TabSelectElementEvents.ITEM_SELECTED, (index, option) => {});
```

### StyledTextRenderable
Rich text rendering with color and formatting.

```typescript
import { StyledTextRenderable, t, bold, fg, bg } from '../core';

const text = renderer.createStyledText('my-text', {
  fragment: t`${bold(fg('#FF0000')('Important:'))} ${fg('#FFFFFF')('Regular text')}`,
  width: 60,
  height: 10,
  x: 10,
  y: 5,
  zIndex: 50,
  defaultFg: '#AAAAAA',
  defaultBg: '#000000'
});

// Template tag helpers:
// t`` - Create styled text template
// bold() - Bold text
// fg(color) - Set foreground color
// bg(color) - Set background color
// dim() - Dimmed text
// italic() - Italic text
// underline() - Underlined text
```

### GroupRenderable
Container for organizing UI elements.

```typescript
import { GroupRenderable } from '../core';

const container = new GroupRenderable('my-container', {
  x: 0,
  y: 0,
  zIndex: 10,
  visible: true
});

// Add children
container.add(childRenderable);
container.remove(childId);
container.clear();
```

### FrameBufferRenderable
For pixel-perfect drawing and custom graphics.

```typescript
import { FrameBufferRenderable, RGBA } from '../core';

// Create buffer first using renderer.lib
const buffer = renderer.lib.createOptimizedBuffer(80, 40, true);
const canvas = new FrameBufferRenderable('my-canvas', buffer, {
  x: 10,
  y: 10,
  width: 80,
  height: 40,
  zIndex: 50
});

// Access the buffer through frameBuffer property
const drawBuffer = canvas.frameBuffer;

// Drawing methods - use RGBA colors
const color = RGBA.fromHex(0xFF0000); // Red
const bgColor = RGBA.fromHex(0x000000); // Black

drawBuffer.setCell(x, y, char, color, bgColor);
drawBuffer.clear(); // or drawBuffer.clear(bgColor) to clear with specific color

// RGBA color creation methods:
RGBA.fromHex(0xFF0000) // From hex number
RGBA.fromInts(255, 0, 0, 255) // From RGBA values (0-255)
RGBA.fromValues(1.0, 0.0, 0.0, 1.0) // From normalized values (0-1)
```

## Layout System

OpenTUI uses Yoga (Facebook's flexbox implementation) for layout management.

```typescript
import { LayoutGroup } from '../core';

const layout = new LayoutGroup('layout', {
  x: 0,
  y: 0,
  width: 120,
  height: 80,
  flexDirection: 'column',  // 'row', 'column'
  justifyContent: 'center',  // 'flex-start', 'center', 'flex-end', 'space-between'
  alignItems: 'center',  // 'flex-start', 'center', 'flex-end', 'stretch'
  padding: 2,
  gap: 1
});

// Add children with flex properties
const child = new GroupRenderable('child', {
  flex: 1,
  alignSelf: 'stretch'
});
layout.add(child);
```

## Border Styles

All UI elements support customizable borders:

```typescript
type BorderStyle = 'single' | 'double' | 'rounded' | 'heavy';

// Border characters for each style:
// single: ┌─┐│└┘
// double: ╔═╗║╚╝
// rounded: ╭─╮│╰╯
// heavy: ┏━┓┃┗┛

element.setBorder(true, 'rounded');
element.setBorderColor('#00AAFF');
```

## Color System

Colors in OpenTUI use the RGBA class for buffer operations:

```typescript
import { RGBA } from '../core';

// Create RGBA colors using factory methods:
const red = RGBA.fromHex(0xFF0000);
const green = RGBA.fromInts(0, 255, 0, 255);
const blue = RGBA.fromValues(0.0, 0.0, 1.0, 1.0);

// For styled text, use hex strings:
const textColor = '#FF0000';  // Red
const bgColor = '#00FF00';     // Green

// When working with buffers:
buffer.setCell(x, y, char, fgColor, bgColor); // Uses RGBA objects

// Common color patterns:
const transparent = RGBA.fromInts(0, 0, 0, 0);
const white = RGBA.fromHex(0xFFFFFF);
const black = RGBA.fromHex(0x000000);
```

## Input Handling

### Keyboard Input
```typescript
import { getKeyHandler } from '../core/ui/lib/KeyHandler';

const keyHandler = getKeyHandler();

keyHandler.on('keypress', (key) => {
  // key object contains:
  // - name: string (key name like 'a', 'enter', 'up', etc.)
  // - ctrl: boolean
  // - shift: boolean
  // - alt: boolean
  // - sequence: string (raw key sequence)
});
```

### Mouse Input
```typescript
renderer.on('mouse', (event: MouseEvent) => {
  // event contains:
  // - type: 'click', 'mousedown', 'mouseup', 'mousemove', 'wheel'
  // - x, y: coordinates
  // - button: MouseButton enum
  // - target: Renderable that was clicked
});
```

## Best Practices

### 1. Z-Index Management
- Background elements: 0-10
- Main content: 50-100
- Overlays/modals: 100-200
- Tooltips/popups: 200+

### 2. Performance
- Use `GroupRenderable` to batch related elements
- Minimize redraws by updating only changed elements
- Use `visible` property to hide/show elements instead of removing/adding
- Cache styled text fragments when possible

### 3. Responsive Design
- Use the layout system for flexible UIs
- Query terminal size with `process.stdout.columns` and `process.stdout.rows`
- Handle resize events appropriately

### 4. Focus Management
- Only one element should have focus at a time
- Use Tab/Shift+Tab for navigation between focusable elements
- Provide visual feedback for focused elements (border color change)

### 5. Accessibility
- Provide clear visual indicators for interactive elements
- Use high contrast colors
- Include descriptive titles and labels
- Support keyboard-only navigation

## Example: Complete Login Form

```typescript
import {
  createCliRenderer,
  GroupRenderable,
  InputElement,
  InputElementEvents,
  StyledTextRenderable,
  FrameBufferRenderable,
  RGBA,
  t, bold, fg
} from '../core';

function createLoginForm(renderer: CliRenderer) {
  const container = new GroupRenderable('login-container', {
    x: 30,
    y: 10,
    zIndex: 100
  });

  // Title
  const title = renderer.createStyledText('title', {
    fragment: t`${bold(fg('#00AAFF')('Login to shellquest.sh'))}`,
    x: 0,
    y: 0,
    width: 40,
    height: 1
  });
  container.add(title);

  // Username input
  const usernameInput = new InputElement('username', {
    x: 0,
    y: 3,
    width: 40,
    height: 3,
    borderStyle: 'rounded',
    borderColor: '#666666',
    focusedBorderColor: '#00AAFF',
    placeholder: 'Username',
    title: 'Username',
    titleAlignment: 'left'
  });
  container.add(usernameInput);

  // Password input
  const passwordInput = new InputElement('password', {
    x: 0,
    y: 7,
    width: 40,
    height: 3,
    borderStyle: 'rounded',
    borderColor: '#666666',
    focusedBorderColor: '#00AAFF',
    placeholder: 'Password',
    title: 'Password',
    titleAlignment: 'left'
  });
  container.add(passwordInput);

  // Error message
  const errorMsg = renderer.createStyledText('error', {
    fragment: t``,
    x: 0,
    y: 11,
    width: 40,
    height: 1,
    defaultFg: '#FF0000'
  });
  container.add(errorMsg);

  // Submit handler
  passwordInput.on(InputElementEvents.ENTER, async (value) => {
    const username = usernameInput.getValue();
    const password = value;
    
    if (!username || !password) {
      errorMsg.fragment = t`${fg('#FF0000')('Please fill in all fields')}`;
      return;
    }

    // Perform login...
  });

  renderer.add(container);
  usernameInput.focus();
  
  return container;
}
```

## Advanced Techniques

### 1. Custom Animations
```typescript
let frame = 0;
const animation = setInterval(() => {
  frame++;
  const color = `hsl(${frame % 360}, 100%, 50%)`;
  element.setBorderColor(color);
}, 50);
```

### 2. Modal Dialogs
```typescript
function createModal(renderer: CliRenderer, message: string) {
  const overlay = new GroupRenderable('overlay', {
    x: 0,
    y: 0,
    zIndex: 1000,
    width: process.stdout.columns,
    height: process.stdout.rows
  });
  
  // Semi-transparent background
  const bgBuffer = renderer.lib.createOptimizedBuffer(
    process.stdout.columns, 
    process.stdout.rows, 
    true
  );
  const bg = new FrameBufferRenderable('modal-bg', bgBuffer, {
    x: 0,
    y: 0,
    width: process.stdout.columns,
    height: process.stdout.rows
  });
  
  // Fill with pattern
  const dimColor = RGBA.fromInts(64, 64, 64, 128);
  const bgColor = RGBA.fromHex(0x000000);
  for (let y = 0; y < bgBuffer.height; y++) {
    for (let x = 0; x < bgBuffer.width; x++) {
      bgBuffer.setCell(x, y, '░', dimColor, bgColor);
    }
  }
  overlay.add(bg);
  
  // Modal content
  const modal = new GroupRenderable('modal', {
    x: Math.floor((process.stdout.columns - 50) / 2),
    y: Math.floor((process.stdout.rows - 10) / 2),
    width: 50,
    height: 10
  });
  // ... add modal content
  overlay.add(modal);
  
  renderer.add(overlay);
}
```

### 3. Progress Bars
```typescript
function createProgressBar(renderer: CliRenderer, progress: number) {
  const width = 40;
  const filled = Math.floor(width * progress);
  const empty = width - filled;
  
  const bar = renderer.createStyledText('progress', {
    fragment: t`[${fg('#00FF00')('█'.repeat(filled))}${fg('#333333')('░'.repeat(empty))}] ${Math.floor(progress * 100)}%`,
    x: 10,
    y: 10,
    width: width + 10,
    height: 1
  });
  
  return bar;
}
```

## Summary

OpenTUI provides a comprehensive toolkit for building sophisticated terminal UIs:
- Rich set of pre-built components (Input, Select, TabSelect)
- Flexible layout system with flexbox support
- Styled text with colors and formatting
- Full mouse and keyboard support
- Customizable borders and themes
- Event-driven architecture

Use these components to create professional, responsive, and user-friendly terminal applications.
