# React Terminal Framework - Implementation Plan

## Overview
Build a complete React framework for the OpenTUI terminal rendering engine that enables developers to write terminal UIs using React components, JSX, and hooks instead of imperative APIs.

## Phase 1: Core React Reconciler

### 1.1 Custom React Reconciler (`src/react/reconciler.ts`)
```typescript
// Using react-reconciler package
import ReactReconciler from 'react-reconciler';

const TerminalReconciler = ReactReconciler({
  supportsMutation: true,
  createInstance(type, props, rootContainer, hostContext, internalHandle) {
    // Map React elements to terminal renderables
    switch(type) {
      case 'group': return new GroupRenderable(generateId(), mapProps(props));
      case 'box': return new BoxRenderable(generateId(), mapProps(props));
      case 'text': return new TextRenderable(generateId(), mapProps(props));
      case 'input': return new InputElement(generateId(), mapProps(props));
      case 'select': return new SelectElement(generateId(), mapProps(props));
      // ... more element types
    }
  },
  appendChild(parent, child) {
    parent.add(child);
  },
  removeChild(parent, child) {
    parent.remove(child.id);
  },
  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    // Update properties on existing instances
    applyProps(instance, newProps);
  },
  // ... other reconciler methods
});
```

### 1.2 React Root Container (`src/react/root.tsx`)
```typescript
export class ReactTerminalRoot {
  private container: ReactReconciler.FiberRoot;
  private renderer: CliRenderer;
  
  constructor(renderer: CliRenderer) {
    this.renderer = renderer;
    this.container = TerminalReconciler.createContainer(
      renderer,
      0,
      false,
      null
    );
  }
  
  render(element: React.ReactElement) {
    TerminalReconciler.updateContainer(element, this.container, null, () => {});
  }
  
  unmount() {
    TerminalReconciler.updateContainer(null, this.container, null, () => {});
  }
}
```

## Phase 2: Component Library

### 2.1 Base Components (`src/react/components/`)

#### Primitive Components
```typescript
// Box.tsx
export interface BoxProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  bg?: string;
  borderStyle?: BorderStyle;
  borderColor?: string;
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
  onClick?: (event: MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const Box: React.FC<BoxProps> = (props) => {
  return <box {...props} />;
};

// Text.tsx
export interface TextProps {
  x?: number;
  y?: number;
  fg?: string;
  bg?: string;
  bold?: boolean;
  underline?: boolean;
  children: string;
}

export const Text: React.FC<TextProps> = (props) => {
  return <text {...props} />;
};

// Group.tsx (Container)
export interface GroupProps {
  x?: number;
  y?: number;
  visible?: boolean;
  children?: React.ReactNode;
}

export const Group: React.FC<GroupProps> = (props) => {
  return <group {...props} />;
};
```

#### Interactive Components
```typescript
// Input.tsx
export interface InputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  password?: boolean;
  focused?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  borderStyle?: BorderStyle;
  borderColor?: string;
  focusedBorderColor?: string;
  title?: string;
}

export const Input: React.FC<InputProps> = (props) => {
  return <input {...props} />;
};

// Select.tsx
export interface SelectOption {
  name: string;
  value: string;
  description?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string, option: SelectOption) => void;
  onSelect?: (value: string, option: SelectOption) => void;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  showDescription?: boolean;
  showScrollIndicator?: boolean;
  borderStyle?: BorderStyle;
  title?: string;
}

export const Select: React.FC<SelectProps> = (props) => {
  return <select {...props} />;
};
```

### 2.2 Styled Components (`src/react/components/styled.tsx`)
```typescript
// StyledText with fragment support
export interface StyledTextProps {
  fragment: TemplateStringsArray | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  defaultFg?: string;
  defaultBg?: string;
}

export const StyledText: React.FC<StyledTextProps> = (props) => {
  return <styledText {...props} />;
};
```

## Phase 3: Hooks & Context

### 3.1 Core Hooks (`src/react/hooks/`)
```typescript
// useRenderer.ts
export function useRenderer(): CliRenderer {
  const context = useContext(RendererContext);
  if (!context) {
    throw new Error('useRenderer must be used within RendererProvider');
  }
  return context.renderer;
}

// useKeyboard.ts
export function useKeyboard(
  handler: (key: KeyPressEvent) => void,
  deps: DependencyList = []
) {
  const renderer = useRenderer();
  
  useEffect(() => {
    const keyHandler = getKeyHandler();
    keyHandler.on('keypress', handler);
    return () => {
      keyHandler.off('keypress', handler);
    };
  }, deps);
}

// useAnimation.ts
export function useAnimation(
  callback: (deltaTime: number) => void,
  deps: DependencyList = []
) {
  const renderer = useRenderer();
  
  useEffect(() => {
    const frameCallback = async (deltaTime: number) => {
      callback(deltaTime);
    };
    renderer.setFrameCallback(frameCallback);
    return () => {
      renderer.removeFrameCallback(frameCallback);
    };
  }, deps);
}

// useMouse.ts
export function useMouse(
  element: RefObject<Renderable>,
  handlers: {
    onClick?: (event: MouseEvent) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onDrag?: (event: MouseEvent) => void;
  }
) {
  useEffect(() => {
    if (!element.current) return;
    
    // Attach mouse event handlers
    // Implementation details...
  }, [element, handlers]);
}
```

### 3.2 Context Providers (`src/react/context/`)
```typescript
// RendererContext.tsx
const RendererContext = React.createContext<{
  renderer: CliRenderer;
} | null>(null);

export const RendererProvider: React.FC<{
  renderer: CliRenderer;
  children: React.ReactNode;
}> = ({ renderer, children }) => {
  return (
    <RendererContext.Provider value={{ renderer }}>
      {children}
    </RendererContext.Provider>
  );
};
```

## Phase 4: Event System

### 4.1 Event Mapping (`src/react/events.ts`)
```typescript
// Map native events to React synthetic events
export function mapMouseEvent(nativeEvent: NativeMouseEvent): React.MouseEvent {
  return {
    type: nativeEvent.type,
    clientX: nativeEvent.x,
    clientY: nativeEvent.y,
    button: nativeEvent.button,
    shiftKey: nativeEvent.modifiers.shift,
    altKey: nativeEvent.modifiers.alt,
    ctrlKey: nativeEvent.modifiers.ctrl,
    preventDefault: () => nativeEvent.preventDefault(),
    stopPropagation: () => { /* implement */ },
    // ... other event properties
  };
}

// Event delegation system for performance
export class EventDelegator {
  private handlers: Map<string, Map<Renderable, Function>>;
  
  attachEvent(element: Renderable, eventType: string, handler: Function) {
    // Register event handler
  }
  
  detachEvent(element: Renderable, eventType: string) {
    // Remove event handler
  }
  
  dispatch(event: NativeEvent) {
    // Bubble event through component tree
  }
}
```

## Phase 5: TypeScript Support

### 5.1 Type Definitions (`src/react/types.d.ts`)
```typescript
declare namespace JSX {
  interface IntrinsicElements {
    box: BoxProps;
    text: TextProps;
    group: GroupProps;
    input: InputProps;
    select: SelectProps;
    styledText: StyledTextProps;
    frameBuffer: FrameBufferProps;
  }
}

// Props type inference
export type TerminalComponentProps<T> = T & {
  ref?: React.Ref<Renderable>;
  key?: React.Key;
};
```

## Phase 6: Performance Optimizations

### 6.1 Batching & Scheduling
```typescript
// Batch updates for better performance
export class UpdateBatcher {
  private pendingUpdates: Set<() => void> = new Set();
  private scheduled = false;
  
  scheduleUpdate(update: () => void) {
    this.pendingUpdates.add(update);
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }
  
  flush() {
    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();
    this.scheduled = false;
    updates.forEach(update => update());
  }
}
```

### 6.2 Memoization
```typescript
// Built-in support for React.memo, useMemo, useCallback
// Reconciler will handle prop comparison for re-renders
```

## Phase 7: Demo Conversions

### 7.1 Input Demo (`src/react/demos/InputDemo.tsx`)
```typescript
export function InputDemo() {
  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [activeInput, setActiveInput] = useState<'name' | 'email' | 'password'>('name');
  
  useKeyboard((key) => {
    if (key.name === 'tab') {
      // Navigate between inputs
      const inputs = ['name', 'email', 'password'];
      const currentIndex = inputs.indexOf(activeInput);
      const nextIndex = key.shift 
        ? (currentIndex - 1 + inputs.length) % inputs.length
        : (currentIndex + 1) % inputs.length;
      setActiveInput(inputs[nextIndex] as any);
    }
  });
  
  return (
    <Group>
      <Input
        x={5}
        y={2}
        width={40}
        height={3}
        value={nameValue}
        onChange={setNameValue}
        focused={activeInput === 'name'}
        placeholder="Enter your name..."
        title="Name"
      />
      
      <Input
        x={5}
        y={6}
        width={40}
        height={3}
        value={emailValue}
        onChange={setEmailValue}
        focused={activeInput === 'email'}
        placeholder="Enter your email..."
        title="Email"
      />
      
      <Input
        x={5}
        y={10}
        width={40}
        height={3}
        value={passwordValue}
        onChange={setPasswordValue}
        focused={activeInput === 'password'}
        placeholder="Enter password..."
        title="Password"
        password
      />
      
      <StyledText
        x={50}
        y={2}
        fragment={t`${bold('Values:')}
Name: ${nameValue}
Email: ${emailValue}
Password: ${'*'.repeat(passwordValue.length)}`}
      />
    </Group>
  );
}
```

### 7.2 Select Demo (`src/react/demos/SelectDemo.tsx`)
```typescript
export function SelectDemo() {
  const [selectedValue, setSelectedValue] = useState('home');
  const [showDescriptions, setShowDescriptions] = useState(true);
  
  const options = [
    { name: 'Home', value: 'home', description: 'Navigate to home' },
    { name: 'Profile', value: 'profile', description: 'View profile' },
    // ... more options
  ];
  
  return (
    <Group>
      <Select
        x={5}
        y={2}
        width={50}
        height={20}
        options={options}
        value={selectedValue}
        onChange={setSelectedValue}
        showDescription={showDescriptions}
        title="Menu Options"
      />
      
      <Text x={60} y={3}>
        Selected: {selectedValue}
      </Text>
    </Group>
  );
}
```

### 7.3 Animation Demo (`src/react/demos/AnimationDemo.tsx`)
```typescript
export function AnimationDemo() {
  const [position, setPosition] = useState({ x: 10, y: 5 });
  const [animationTime, setAnimationTime] = useState(0);
  
  useAnimation((deltaTime) => {
    setAnimationTime(prev => prev + deltaTime);
    const angle = (animationTime / 1000) * Math.PI * 2;
    setPosition({
      x: 20 + Math.cos(angle) * 15,
      y: 10 + Math.sin(angle) * 8
    });
  });
  
  return (
    <Group>
      <Box
        x={Math.round(position.x)}
        y={Math.round(position.y)}
        width={30}
        height={10}
        borderStyle="double"
        title="Moving Box"
      >
        <Text x={2} y={2}>
          Position: ({Math.round(position.x)}, {Math.round(position.y)})
        </Text>
      </Box>
    </Group>
  );
}
```

## Phase 8: Entry Point & Runner

### 8.1 Main Entry (`src/react/index.tsx`)
```typescript
export { ReactTerminalRoot } from './root';
export * from './components';
export * from './hooks';
export * from './context';

// Create React app runner
export async function createReactApp(
  App: React.ComponentType,
  config?: CliRendererConfig
): Promise<ReactTerminalRoot> {
  const renderer = await createCliRenderer(config);
  const root = new ReactTerminalRoot(renderer);
  
  renderer.start();
  
  root.render(
    <RendererProvider renderer={renderer}>
      <App />
    </RendererProvider>
  );
  
  return root;
}
```

### 8.2 Demo Runner (`src/react/demos/index.tsx`)
```typescript
import { createReactApp } from '../index';
import { InputDemo } from './InputDemo';
import { SelectDemo } from './SelectDemo';
import { AnimationDemo } from './AnimationDemo';

// Main app that combines all demos
function App() {
  const [activeDemo, setActiveDemo] = useState<'input' | 'select' | 'animation'>('input');
  
  return (
    <>
      {activeDemo === 'input' && <InputDemo />}
      {activeDemo === 'select' && <SelectDemo />}
      {activeDemo === 'animation' && <AnimationDemo />}
    </>
  );
}

// Run the app
createReactApp(App, {
  exitOnCtrlC: true,
  targetFps: 30
});
```

## Implementation Order

1. **Core Reconciler** - Build the basic reconciler with create/update/delete operations
2. **Basic Components** - Implement Box, Text, Group components
3. **Event System** - Add mouse and keyboard event handling
4. **Hooks** - Implement useRenderer, useKeyboard, useAnimation
5. **Interactive Components** - Add Input and Select components
6. **Demo Conversions** - Convert existing demos to React
7. **Optimizations** - Add batching, memoization
8. **Testing** - Ensure all demos work with full React functionality

## Key Technical Decisions

1. **ID Generation**: Auto-generate unique IDs for each component instance
2. **Props Mapping**: Convert React props to terminal renderer properties
3. **Event Bubbling**: Implement proper event bubbling through component tree
4. **Lifecycle**: Handle component mounting, updating, unmounting correctly
5. **State Management**: Full support for useState, useReducer, useContext
6. **Refs**: Support useRef for direct access to terminal renderables
7. **Performance**: Batch updates, implement React.memo support
8. **Type Safety**: Full TypeScript support with proper JSX types

## Success Criteria

- ✅ All three demos fully functional with React
- ✅ Full state management with hooks
- ✅ Event handling (keyboard, mouse)
- ✅ Animations using useAnimation hook
- ✅ Component composition and children
- ✅ TypeScript/TSX support
- ✅ Performance comparable to imperative API
- ✅ Clean, React-like developer experience