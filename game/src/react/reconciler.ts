import * as React from 'react';
import ReactReconciler from 'react-reconciler';
import {
  BoxRenderable,
  TextRenderable,
  GroupRenderable,
  StyledTextRenderable,
  type CliRenderer,
} from '../core';
import { InputElement } from '../core/ui/elements/input';
import { SelectElement, type SelectOption } from '../core/ui/elements/select';
import { type BorderStyle } from '../core/ui/lib/border';
import { type StyledTextFragment } from '../core/styled-text';

// Define event types
type InputElementEvents = 'input' | 'enter' | 'focused' | 'blurred';
type SelectElementEvents = 'selection_changed' | 'item_selected' | 'focused' | 'blurred';

// Text attributes enum
enum TextAttributes {
  BOLD = 1 << 0,
  UNDERLINE = 1 << 1,
  ITALIC = 1 << 2,
  STRIKETHROUGH = 1 << 3,
  BLINK = 1 << 4,
  INVERSE = 1 << 5,
  DIM = 1 << 6,
}

let instanceId = 0;
const generateId = () => `react-${instanceId++}`;

type HostConfig = ReactReconciler.HostConfig<
  string, // Type
  any, // Props
  any, // Container
  any, // Instance
  any, // TextInstance
  any, // SuspenseInstance
  any, // HydratableInstance
  any, // PublicInstance
  any, // HostContext
  any, // UpdatePayload
  any, // ChildSet
  number, // TimeoutHandle
  number // NoTimeout
>;

// Helper to map React props to terminal renderer properties
function mapCommonProps(props: any): any {
  const mapped: any = {
    x: props.x ?? 0,
    y: props.y ?? 0,
    zIndex: props.zIndex ?? 1,
    visible: props.visible !== false,
  };

  if (props.width !== undefined) mapped.width = props.width;
  if (props.height !== undefined) mapped.height = props.height;

  return mapped;
}

function mapBoxProps(props: any): any {
  return {
    ...mapCommonProps(props),
    bg: props.bg,
    borderStyle: props.borderStyle as BorderStyle | undefined,
    borderColor: props.borderColor,
    title: props.title,
    titleAlignment: props.titleAlignment,
  };
}

function mapTextProps(props: any): any {
  return {
    ...mapCommonProps(props),
    content: props.children || '',
    fg: props.fg,
    bg: props.bg,
    attributes:
      (props.bold ? TextAttributes.BOLD : 0) |
      (props.underline ? TextAttributes.UNDERLINE : 0) |
      (props.italic ? TextAttributes.ITALIC : 0) |
      (props.strikethrough ? TextAttributes.STRIKETHROUGH : 0) |
      (props.blink ? TextAttributes.BLINK : 0) |
      (props.inverse ? TextAttributes.INVERSE : 0) |
      (props.dim ? TextAttributes.DIM : 0),
  };
}

function mapInputProps(props: any): any {
  return {
    ...mapCommonProps(props),
    value: props.value || '',
    placeholder: props.placeholder,
    placeholderColor: props.placeholderColor,
    maxLength: props.maxLength,
    backgroundColor: props.backgroundColor || props.bg,
    textColor: props.textColor || props.fg,
    borderStyle: props.borderStyle as BorderStyle | undefined,
    borderColor: props.borderColor,
    focusedBorderColor: props.focusedBorderColor,
    cursorColor: props.cursorColor,
    title: props.title,
    titleAlignment: props.titleAlignment,
  };
}

function mapSelectProps(props: any): any {
  return {
    ...mapCommonProps(props),
    options: props.options || [],
    backgroundColor: props.backgroundColor || props.bg,
    selectedBackgroundColor: props.selectedBackgroundColor,
    selectedTextColor: props.selectedTextColor,
    textColor: props.textColor || props.fg,
    selectedDescriptionColor: props.selectedDescriptionColor,
    descriptionColor: props.descriptionColor,
    borderStyle: props.borderStyle as BorderStyle | undefined,
    borderColor: props.borderColor,
    focusedBorderColor: props.focusedBorderColor,
    showDescription: props.showDescription,
    showScrollIndicator: props.showScrollIndicator,
    wrapSelection: props.wrapSelection,
    title: props.title,
    titleAlignment: props.titleAlignment,
    fastScrollStep: props.fastScrollStep,
  };
}

function mapStyledTextProps(props: any): any {
  return {
    ...mapCommonProps(props),
    fragment: props.fragment,
    defaultFg: props.defaultFg,
    defaultBg: props.defaultBg,
  };
}

function createInstance(type: string, props: any, renderer: CliRenderer): any {
  const id = generateId();

  switch (type) {
    case 'group':
      return new GroupRenderable(id, mapCommonProps(props));

    case 'box':
      return new BoxRenderable(id, mapBoxProps(props));

    case 'text':
      return new TextRenderable(id, mapTextProps(props));

    case 'input': {
      const input = new InputElement(id, mapInputProps(props));

      // Attach event handlers
      if (props.onChange) {
        input.on('input' as InputElementEvents, props.onChange);
      }
      if (props.onSubmit) {
        input.on('enter' as InputElementEvents, props.onSubmit);
      }
      if (props.onFocus) {
        input.on('focused' as InputElementEvents, props.onFocus);
      }
      if (props.onBlur) {
        input.on('blurred' as InputElementEvents, props.onBlur);
      }

      // Handle controlled focus
      if (props.focused !== undefined) {
        if (props.focused) {
          input.focus();
        } else {
          input.blur();
        }
      }

      return input;
    }

    case 'select': {
      const select = new SelectElement(id, mapSelectProps(props));

      // Attach event handlers
      if (props.onChange) {
        select.on(
          'selection_changed' as SelectElementEvents,
          (index: number, option: SelectOption) => {
            props.onChange(option.value, option);
          },
        );
      }
      if (props.onSelect) {
        select.on('item_selected' as SelectElementEvents, (index: number, option: SelectOption) => {
          props.onSelect(option.value, option);
        });
      }
      if (props.onFocus) {
        select.on('focused' as SelectElementEvents, props.onFocus);
      }
      if (props.onBlur) {
        select.on('blurred' as SelectElementEvents, props.onBlur);
      }

      // Handle controlled value
      if (props.value !== undefined) {
        const index = props.options?.findIndex((opt: SelectOption) => opt.value === props.value);
        if (index >= 0) {
          select.setSelectedIndex(index);
        }
      }

      // Handle controlled focus
      if (props.focused !== undefined) {
        if (props.focused) {
          select.focus();
        } else {
          select.blur();
        }
      }

      return select;
    }

    case 'styledText': {
      const buffer = renderer.lib.createOptimizedBuffer(
        props.width ?? renderer.width,
        props.height ?? renderer.height,
        true,
      );
      return new StyledTextRenderable(id, buffer, mapStyledTextProps(props));
    }

    default:
      throw new Error(`Unknown element type: ${type}`);
  }
}

function updateInstance(
  instance: any,
  type: string,
  oldProps: any,
  newProps: any,
  renderer: CliRenderer,
): void {
  // Update common properties
  if (oldProps.x !== newProps.x) instance.x = newProps.x ?? 0;
  if (oldProps.y !== newProps.y) instance.y = newProps.y ?? 0;
  if (oldProps.zIndex !== newProps.zIndex) instance.zIndex = newProps.zIndex ?? 1;
  if (oldProps.visible !== newProps.visible) instance.visible = newProps.visible !== false;
  if (oldProps.width !== newProps.width && newProps.width !== undefined)
    instance.width = newProps.width;
  if (oldProps.height !== newProps.height && newProps.height !== undefined)
    instance.height = newProps.height;

  // Update type-specific properties
  switch (type) {
    case 'box':
      if (instance instanceof BoxRenderable) {
        if (oldProps.bg !== newProps.bg) instance.bg = newProps.bg;
        if (oldProps.borderStyle !== newProps.borderStyle) {
          if (newProps.borderStyle) {
            instance.setBorder(true, newProps.borderStyle);
          } else {
            instance.setBorder(false);
          }
        }
        if (oldProps.borderColor !== newProps.borderColor)
          instance.borderColor = newProps.borderColor;
        if (oldProps.title !== newProps.title) instance.title = newProps.title;
        if (oldProps.titleAlignment !== newProps.titleAlignment)
          instance.titleAlignment = newProps.titleAlignment;
      }
      break;

    case 'text':
      if (instance instanceof TextRenderable) {
        if (oldProps.children !== newProps.children) instance.content = newProps.children || '';
        if (oldProps.fg !== newProps.fg) instance.fg = newProps.fg;
        if (oldProps.bg !== newProps.bg) instance.bg = newProps.bg;

        // Update attributes
        const newAttributes =
          (newProps.bold ? TextAttributes.BOLD : 0) |
          (newProps.underline ? TextAttributes.UNDERLINE : 0) |
          (newProps.italic ? TextAttributes.ITALIC : 0) |
          (newProps.strikethrough ? TextAttributes.STRIKETHROUGH : 0) |
          (newProps.blink ? TextAttributes.BLINK : 0) |
          (newProps.inverse ? TextAttributes.INVERSE : 0) |
          (newProps.dim ? TextAttributes.DIM : 0);

        if (instance.attributes !== newAttributes) {
          instance.attributes = newAttributes;
        }
      }
      break;

    case 'input':
      if (instance instanceof InputElement) {
        if (oldProps.value !== newProps.value) instance.setValue(newProps.value || '');
        if (oldProps.placeholder !== newProps.placeholder)
          instance.setPlaceholder(newProps.placeholder);
        if (oldProps.focused !== newProps.focused) {
          if (newProps.focused) {
            instance.focus();
          } else {
            instance.blur();
          }
        }

        // Update event handlers
        if (oldProps.onChange !== newProps.onChange) {
          if (oldProps.onChange) instance.off('input' as InputElementEvents, oldProps.onChange);
          if (newProps.onChange) instance.on('input' as InputElementEvents, newProps.onChange);
        }
        if (oldProps.onSubmit !== newProps.onSubmit) {
          if (oldProps.onSubmit) instance.off('enter' as InputElementEvents, oldProps.onSubmit);
          if (newProps.onSubmit) instance.on('enter' as InputElementEvents, newProps.onSubmit);
        }
      }
      break;

    case 'select':
      if (instance instanceof SelectElement) {
        if (oldProps.options !== newProps.options) {
          instance.setOptions(newProps.options || []);
        }
        if (oldProps.value !== newProps.value && newProps.value !== undefined) {
          const index = newProps.options?.findIndex(
            (opt: SelectOption) => opt.value === newProps.value,
          );
          if (index >= 0) {
            instance.setSelectedIndex(index);
          }
        }
        if (oldProps.showDescription !== newProps.showDescription) {
          instance.setShowDescription(newProps.showDescription);
        }
        if (oldProps.showScrollIndicator !== newProps.showScrollIndicator) {
          instance.setShowScrollIndicator(newProps.showScrollIndicator);
        }
        if (oldProps.focused !== newProps.focused) {
          if (newProps.focused) {
            instance.focus();
          } else {
            instance.blur();
          }
        }

        // Update event handlers
        if (oldProps.onChange !== newProps.onChange) {
          if (oldProps.onChange) {
            instance.off('selection_changed' as SelectElementEvents, oldProps.onChange);
          }
          if (newProps.onChange) {
            instance.on(
              'selection_changed' as SelectElementEvents,
              (index: number, option: SelectOption) => {
                newProps.onChange(option.value, option);
              },
            );
          }
        }
      }
      break;

    case 'styledText':
      if (instance instanceof StyledTextRenderable) {
        if (oldProps.fragment !== newProps.fragment) {
          instance.fragment = newProps.fragment;
        }
        if (oldProps.defaultFg !== newProps.defaultFg) {
          instance.defaultFg = newProps.defaultFg;
        }
        if (oldProps.defaultBg !== newProps.defaultBg) {
          instance.defaultBg = newProps.defaultBg;
        }
      }
      break;
  }
}

export const TerminalReconciler = ReactReconciler<
  string, // Type
  any, // Props
  CliRenderer, // Container
  any, // Instance
  any, // TextInstance
  any, // SuspenseInstance
  any, // HydratableInstance
  any, // PublicInstance
  any, // HostContext
  any[], // UpdatePayload
  any, // ChildSet
  number, // TimeoutHandle
  number // NoTimeout
>({
  supportsMutation: true,
  supportsPersistence: false,

  createInstance(type, props, rootContainer, hostContext, internalHandle) {
    return createInstance(type, props, rootContainer);
  },

  createTextInstance(text, rootContainer, hostContext, internalHandle) {
    // Text nodes are handled as children of Text components
    return text;
  },

  appendInitialChild(parent, child) {
    if (typeof child === 'string') return;
    parent.add(child);
  },

  finalizeInitialChildren(instance, type, props, rootContainer, hostContext) {
    return false;
  },

  prepareUpdate(instance, type, oldProps, newProps, rootContainer, hostContext) {
    // Return an update payload to trigger commitUpdate
    return [oldProps, newProps];
  },

  shouldSetTextContent(type, props) {
    return false;
  },

  getRootHostContext(rootContainer) {
    return {};
  },

  getChildHostContext(parentHostContext, type, rootContainer) {
    return parentHostContext;
  },

  getPublicInstance(instance) {
    return instance;
  },

  prepareForCommit(containerInfo) {
    return null;
  },

  resetAfterCommit(containerInfo) {
    containerInfo.needsUpdate = true;
  },

  preparePortalMount(containerInfo) {
    // No-op
  },

  now: Date.now,

  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,

  isPrimaryRenderer: true,
  warnsIfNotActing: true,
  supportsMicrotask: true,
  scheduleMicrotask: queueMicrotask,

  appendChild(parent, child) {
    if (typeof child === 'string') return;
    parent.add(child);
  },

  appendChildToContainer(container, child) {
    if (typeof child === 'string') return;
    container.add(child);
  },

  insertBefore(parent, child, beforeChild) {
    if (typeof child === 'string') return;
    // Terminal renderer doesn't support insertBefore, so we add and re-sort
    parent.add(child);
    // TODO: Implement proper insertion order if needed
  },

  insertInContainerBefore(container, child, beforeChild) {
    if (typeof child === 'string') return;
    container.add(child);
    // TODO: Implement proper insertion order if needed
  },

  removeChild(parent, child) {
    if (typeof child === 'string') return;
    parent.remove(child.id);

    // Clean up event handlers for input/select elements
    if (child instanceof InputElement || child instanceof SelectElement) {
      child.removeAllListeners();
      child.destroy();
    }
  },

  removeChildFromContainer(container, child) {
    if (typeof child === 'string') return;
    container.remove(child.id);

    // Clean up event handlers for input/select elements
    if (child instanceof InputElement || child instanceof SelectElement) {
      child.removeAllListeners();
      child.destroy();
    }
  },

  commitUpdate(instance, updatePayload, type, oldProps, newProps, internalHandle) {
    const [,] = updatePayload;
    updateInstance(instance, type, oldProps, newProps, instance.parent || instance);
  },

  commitTextUpdate(textInstance, oldText, newText) {
    // Text updates are handled in parent Text components
  },

  clearContainer(container) {
    container.clear();
  },

  hideInstance(instance) {
    instance.visible = false;
  },

  hideTextInstance(textInstance) {
    // No-op
  },

  unhideInstance(instance) {
    instance.visible = true;
  },

  unhideTextInstance(textInstance) {
    // No-op
  },

  resetTextContent(instance) {
    if (instance instanceof TextRenderable) {
      instance.content = '';
    }
  },

  supportsHydration: false,
});
