import { EventEmitter } from "events"
import {uIOhook, UiohookKey} from 'uiohook-napi';

interface KeyEvent {
  name: string
  ctrl: boolean
  shift: boolean
  meta: boolean
  alt: boolean
}

export class KeyHandler extends EventEmitter {
  private keyStates: Map<string, boolean> = new Map()
  private isStarted = false

  constructor() {
    super()
    this.setupIOHook()
  }

  private setupIOHook(): void {
    uIOhook.on("keydown", (e) => {
      const keyEvent = this.convertIOHookEvent(e)
      const keyId = this.getKeyId(keyEvent)
      
      if (!this.keyStates.get(keyId)) {
        this.keyStates.set(keyId, true)
        this.emit("keydown", keyEvent)
      }
      
      this.emit("keypress", keyEvent)
    })

    uIOhook.on("keyup", (e) => {
      const keyEvent = this.convertIOHookEvent(e)
      const keyId = this.getKeyId(keyEvent)
      
      if (this.keyStates.get(keyId)) {
        this.keyStates.set(keyId, false)
        this.emit("keyup", keyEvent)
      }
    })
    uIOhook.start()
  }

  private convertIOHookEvent(e: any): KeyEvent {
    // Map iohook key codes to readable names
    const keyName = this.getKeyNameFromCode(e.keycode)
    
    return {
      name: keyName,
      ctrl: e.ctrlKey || false,
      shift: e.shiftKey || false,
      meta: e.metaKey || false,
      alt: e.altKey || false
    }
  }

  private getKeyNameFromCode(keycode: number): string {
    // Common key mappings for iohook
    const keyMap: { [key: number]: string } = {
      // Letters
      30: 'a', 48: 'b', 46: 'c', 32: 'd', 18: 'e', 33: 'f', 34: 'g',
      35: 'h', 23: 'i', 36: 'j', 37: 'k', 38: 'l', 50: 'm', 49: 'n',
      24: 'o', 25: 'p', 16: 'q', 19: 'r', 31: 's', 20: 't', 22: 'u',
      47: 'v', 17: 'w', 45: 'x', 21: 'y', 44: 'z',
      
      // Numbers
      11: '0', 2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9',
      
      // Special keys
      28: 'enter', 57: 'space', 1: 'escape', 14: 'backspace', 15: 'tab',
      29: 'ctrl', 42: 'shift', 56: 'alt', 125: 'meta',
      
      // Arrow keys
      72: 'up', 80: 'down', 75: 'left', 77: 'right',
      
      // Function keys
      59: 'f1', 60: 'f2', 61: 'f3', 62: 'f4', 63: 'f5', 64: 'f6',
      65: 'f7', 66: 'f8', 67: 'f9', 68: 'f10', 87: 'f11', 88: 'f12'
    }
    
    return keyMap[keycode] || `key_${keycode}`
  }

  private getKeyId(key: KeyEvent): string {
    const modifiers = []
    if (key.ctrl) modifiers.push("ctrl")
    if (key.shift) modifiers.push("shift")
    if (key.meta) modifiers.push("meta")
    if (key.alt) modifiers.push("alt")
    return [...modifiers, key.name].join("+")
  }

  public start(): void {
    if (!this.isStarted) {
      uIOhook.start()
      this.isStarted = true
    }
  }

  public stop(): void {
    if (this.isStarted) {
      uIOhook.stop()
      this.isStarted = false
    }
  }

  public isKeyPressed(keyName: string): boolean {
    return this.keyStates.get(keyName) || false
  }

  public destroy(): void {
    this.stop()
    this.keyStates.clear()
    this.removeAllListeners()
  }
}

let keyHandler: KeyHandler | null = null

export function getKeyHandler(): KeyHandler {
  if (!keyHandler) {
    keyHandler = new KeyHandler()
  }
  return keyHandler
}
