import { EventEmitter } from "events"
import { parseKeypress } from "../../parse.keypress"

export class KeyHandler extends EventEmitter {
  getMaxListeners(): number {
    return Infinity;
  }
  constructor() {
    super();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (key: Buffer) => {
      const parsedKey = parseKeypress(key);
      this.emit('keypress', parsedKey);
      this.emit('keydown', parsedKey);
      this.emit('keyup', parsedKey);
    });
  }

  public destroy(): void {
    process.stdin.removeAllListeners('data');
  }
}

let keyHandler: KeyHandler | null = null

export function getKeyHandler(): KeyHandler {
  if (!keyHandler) {
    keyHandler = new KeyHandler()
  }
  return keyHandler
}


/*
import { EventEmitter } from "events"
import { parseKeypress } from "../../parse.keypress"

interface KeyEvent {
  name: string
  ctrl: boolean
  shift: boolean
  meta: boolean
  alt: boolean
}

interface KeyState {
  isDown: boolean
  lastPressTime: number
  releaseTimer: NodeJS.Timeout | null
  repeatDetected: boolean
}

export class KeyHandler extends EventEmitter {
  private keyStates: Map<string, KeyState> = new Map()
  private readonly INITIAL_REPEAT_DELAY = 500 // Initial delay before key repeat starts (ms)
  private readonly REPEAT_RATE = 50 // Key repeat rate (ms between repeats)
  private readonly RELEASE_BUFFER = 100 // Extra time to wait before releasing key (ms)

  constructor() {
    super()

    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding("utf8")

    process.stdin.on("data", (key: Buffer) => {
      const parsedKey = parseKeypress(key)
      this.handleKeypress(parsedKey)
    })
  }

  private handleKeypress(keyEvent: any): void {
    // Convert parsed key to our KeyEvent format
    const key: KeyEvent = {
      name: keyEvent.name || 'unknown',
      ctrl: keyEvent.ctrl || false,
      shift: keyEvent.shift || false,
      meta: keyEvent.meta || false,
      alt: keyEvent.alt || false
    }

    const keyId = this.getKeyId(key)
    const now = Date.now()
    const currentState = this.keyStates.get(keyId)

    // Always emit keypress
    this.emit("keypress", key)

    if (!currentState) {
      // First press of this key
      this.setKeyDown(keyId, key, now)
    } else {
      // Key is already being tracked
      const timeSinceLastPress = now - currentState.lastPressTime
      
      // Clear any existing release timer
      if (currentState.releaseTimer) {
        clearTimeout(currentState.releaseTimer)
        currentState.releaseTimer = null
      }

      // Check if this is a repeat
      if (timeSinceLastPress < this.INITIAL_REPEAT_DELAY + this.RELEASE_BUFFER) {
        // This is likely the start of key repeat or continuation
        currentState.repeatDetected = true
        currentState.lastPressTime = now
        this.scheduleKeyRelease(keyId, key, now, true)
      } else {
        // This is a new press after the key was logically released
        if (currentState.isDown) {
          // Fire keyup for the previous press
          this.setKeyUp(keyId, key)
        }
        // Start new press
        this.setKeyDown(keyId, key, now)
      }
    }
  }

  private setKeyDown(keyId: string, key: KeyEvent, time: number): void {
    const state: KeyState = {
      isDown: true,
      lastPressTime: time,
      releaseTimer: null,
      repeatDetected: false
    }
    
    this.keyStates.set(keyId, state)
    this.emit("keydown", key)
    
    // Schedule potential release
    this.scheduleKeyRelease(keyId, key, time, false)
  }

  private setKeyUp(keyId: string, key: KeyEvent): void {
    const state = this.keyStates.get(keyId)
    if (state && state.isDown) {
      state.isDown = false
      if (state.releaseTimer) {
        clearTimeout(state.releaseTimer)
        state.releaseTimer = null
      }
      this.emit("keyup", key)
    }
  }

  private scheduleKeyRelease(keyId: string, key: KeyEvent, pressTime: number, isRepeat: boolean): void {
    const state = this.keyStates.get(keyId)
    if (!state) return

    // Clear existing timer
    if (state.releaseTimer) {
      clearTimeout(state.releaseTimer)
    }

    // Determine timeout based on whether we're in repeat mode
    const timeout = isRepeat 
      ? this.REPEAT_RATE * 3 + this.RELEASE_BUFFER // Wait longer during repeat to detect end
      : this.INITIAL_REPEAT_DELAY + this.RELEASE_BUFFER

    state.releaseTimer = setTimeout(() => {
      const currentState = this.keyStates.get(keyId)
      if (currentState && currentState.isDown && currentState.lastPressTime === pressTime) {
        // No new keypress detected, release the key
        this.setKeyUp(keyId, key)
      }
    }, timeout)
  }

  private getKeyId(key: KeyEvent): string {
    const modifiers = []
    if (key.ctrl) modifiers.push('ctrl')
    if (key.shift) modifiers.push('shift')
    if (key.meta) modifiers.push('meta')
    if (key.alt) modifiers.push('alt')
    return [...modifiers, key.name].join('+')
  }

  public isKeyPressed(keyName: string): boolean {
    const state = this.keyStates.get(keyName)
    return state?.isDown || false
  }

  public destroy(): void {
    // Clear all timers
    for (const [keyId, state] of this.keyStates) {
      if (state.releaseTimer) {
        clearTimeout(state.releaseTimer)
      }
    }
    this.keyStates.clear()
    process.stdin.removeAllListeners("data")
  }
}

let keyHandler: KeyHandler | null = null

export function getKeyHandler(): KeyHandler {
  if (!keyHandler) {
    keyHandler = new KeyHandler()
  }
  return keyHandler
}*/


/*import {EventEmitter} from 'events';
import {uIOhook, UiohookKey} from 'uiohook-napi';

interface KeyEvent {
  name: string;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  alt: boolean;
}

export class KeyHandler extends EventEmitter {
  private keyStates: Map<string, boolean> = new Map();
  private isStarted = false;

  constructor() {
    super();
    this.setupIOHook();
  }

  private setupIOHook(): void {
    uIOhook.on('keydown', (e) => {
      const keyEvent = this.convertIOHookEvent(e);
      const keyId = this.getKeyId(keyEvent);

      if (!this.keyStates.get(keyId)) {
        this.keyStates.set(keyId, true);
        this.emit('keydown', keyEvent);
      }

      this.emit('keypress', keyEvent);
    });

    uIOhook.on('keyup', (e) => {
      const keyEvent = this.convertIOHookEvent(e);
      const keyId = this.getKeyId(keyEvent);

      if (this.keyStates.get(keyId)) {
        this.keyStates.set(keyId, false);
        this.emit('keyup', keyEvent);
      }
    });
    uIOhook.start();
  }

  private convertIOHookEvent(e: any): KeyEvent {
    // Map iohook key codes to readable names
    const keyName = this.getKeyNameFromCode(e.keycode);

    return {
      name: keyName,
      ctrl: e.ctrlKey || false,
      shift: e.shiftKey || false,
      meta: e.metaKey || false,
      alt: e.altKey || false,
    };
  }

  private getKeyNameFromCode(keycode: number): string {
    // Common key mappings for iohook
    const keyMap: {[key: number]: string} = {
      // Letters
      30: 'a',
      48: 'b',
      46: 'c',
      32: 'd',
      18: 'e',
      33: 'f',
      34: 'g',
      35: 'h',
      23: 'i',
      36: 'j',
      37: 'k',
      38: 'l',
      50: 'm',
      49: 'n',
      24: 'o',
      25: 'p',
      16: 'q',
      19: 'r',
      31: 's',
      20: 't',
      22: 'u',
      47: 'v',
      17: 'w',
      45: 'x',
      21: 'y',
      44: 'z',

      // Numbers
      11: '0',
      2: '1',
      3: '2',
      4: '3',
      5: '4',
      6: '5',
      7: '6',
      8: '7',
      9: '8',
      10: '9',

      // Special keys
      28: 'enter',
      57: 'space',
      1: 'escape',
      14: 'backspace',
      15: 'tab',
      29: 'ctrl',
      42: 'shift',
      56: 'alt',
      125: 'meta',

      // Arrow keys
      72: 'up',
      80: 'down',
      75: 'left',
      77: 'right',

      // Function keys
      59: 'f1',
      60: 'f2',
      61: 'f3',
      62: 'f4',
      63: 'f5',
      64: 'f6',
      65: 'f7',
      66: 'f8',
      67: 'f9',
      68: 'f10',
      87: 'f11',
      88: 'f12',
    };

    return keyMap[keycode] || `key_${keycode}`;
  }

  private getKeyId(key: KeyEvent): string {
    const modifiers = [];
    if (key.ctrl) modifiers.push('ctrl');
    if (key.shift) modifiers.push('shift');
    if (key.meta) modifiers.push('meta');
    if (key.alt) modifiers.push('alt');
    return [...modifiers, key.name].join('+');
  }

  public start(): void {
    if (!this.isStarted) {
      uIOhook.start();
      this.isStarted = true;
    }
  }

  public stop(): void {
    if (this.isStarted) {
      uIOhook.stop();
      this.isStarted = false;
    }
  }

  public isKeyPressed(keyName: string): boolean {
    return this.keyStates.get(keyName) || false;
  }

  public destroy(): void {
    this.stop();
    this.keyStates.clear();
    this.removeAllListeners();
  }
}

let keyHandler: KeyHandler | null = null;

export function getKeyHandler(): KeyHandler {
  if (!keyHandler) {
    keyHandler = new KeyHandler();
  }
  return keyHandler;
}
*/

/*NEVER REMOVE THE ABOVE BLOCKS OF CODE FOOL*/
