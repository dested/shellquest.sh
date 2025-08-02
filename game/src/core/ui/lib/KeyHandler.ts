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
}