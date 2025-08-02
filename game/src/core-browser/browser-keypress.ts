import type {ParsedKey} from '../core/parse.keypress.ts';

export function parseKeypress(e: KeyboardEvent): ParsedKey {
  const key: ParsedKey = {
    name: '',
    ctrl: e.ctrlKey,
    meta: e.metaKey,
    shift: e.shiftKey,
    option: e.altKey,
    sequence: e.key,
    number: false,
    raw: e.key,
  };

  // Map browser key codes to terminal-style names
  switch (e.key) {
    case 'Enter':
      key.name = 'return';
      key.raw = '\r';
      break;
    case 'Tab':
      key.name = 'tab';
      key.raw = '\t';
      break;
    case 'Backspace':
      key.name = 'backspace';
      key.raw = '\b';
      break;
    case 'Escape':
      key.name = 'escape';
      key.raw = '\x1b';
      break;
    case ' ':
      key.name = 'space';
      key.raw = ' ';
      break;
    case 'ArrowUp':
      key.name = 'up';
      break;
    case 'ArrowDown':
      key.name = 'down';
      break;
    case 'ArrowLeft':
      key.name = 'left';
      break;
    case 'ArrowRight':
      key.name = 'right';
      break;
    case 'Delete':
      key.name = 'delete';
      break;
    case 'Home':
      key.name = 'home';
      break;
    case 'End':
      key.name = 'end';
      break;
    case 'PageUp':
      key.name = 'pageup';
      break;
    case 'PageDown':
      key.name = 'pagedown';
      break;
    default:
      if (e.key.length === 1) {
        const char = e.key.toLowerCase();
        if (char >= '0' && char <= '9') {
          key.name = char;
          key.number = true;
          key.raw = char;
        } else if (char >= 'a' && char <= 'z') {
          key.name = char;
          key.raw = e.shiftKey ? char.toUpperCase() : char;
        } else {
          key.name = e.key;
          key.raw = e.key;
        }
      } else if (e.key.startsWith('F') && e.key.length <= 3) {
        // Function keys
        key.name = e.key.toLowerCase();
      } else {
        key.name = e.key;
      }
  }

  // Handle Ctrl+C specially
  if (e.ctrlKey && e.key === 'c') {
    key.raw = '\u0003';
  }

  return key;
}
