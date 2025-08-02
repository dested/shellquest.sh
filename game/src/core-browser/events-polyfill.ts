/**
 * Browser polyfill for Node.js 'events' module
 * Provides EventEmitter functionality for browser environments
 */

export class EventEmitter {
  private events: Map<string | symbol, Function[]> = new Map()
  private maxListeners: number = 10

  addListener(eventName: string | symbol, listener: Function): this {
    return this.on(eventName, listener)
  }

  on(eventName: string | symbol, listener: Function): this {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, [])
    }
    const listeners = this.events.get(eventName)!
    listeners.push(listener)
    
    // Warning for too many listeners
    if (listeners.length > this.maxListeners) {
      console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${listeners.length} ${String(eventName)} listeners added.`)
    }
    
    return this
  }

  once(eventName: string | symbol, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(eventName, onceWrapper)
      listener.apply(this, args)
    }
    return this.on(eventName, onceWrapper)
  }

  removeListener(eventName: string | symbol, listener: Function): this {
    const listeners = this.events.get(eventName)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
        if (listeners.length === 0) {
          this.events.delete(eventName)
        }
      }
    }
    return this
  }

  off(eventName: string | symbol, listener: Function): this {
    return this.removeListener(eventName, listener)
  }

  removeAllListeners(eventName?: string | symbol): this {
    if (eventName === undefined) {
      this.events.clear()
    } else {
      this.events.delete(eventName)
    }
    return this
  }

  emit(eventName: string | symbol, ...args: any[]): boolean {
    const listeners = this.events.get(eventName)
    if (!listeners || listeners.length === 0) {
      return false
    }

    // Copy listeners array to avoid issues if listeners are modified during emission
    const listenersToCall = [...listeners]
    for (const listener of listenersToCall) {
      try {
        listener.apply(this, args)
      } catch (error) {
        // In Node.js, uncaught exceptions in event handlers are handled by the 'error' event
        if (eventName !== 'error') {
          this.emit('error', error)
        } else {
          // If error event handler throws, we need to handle it somehow
          console.error('Uncaught exception in error event handler:', error)
        }
      }
    }
    return true
  }

  eventNames(): (string | symbol)[] {
    return Array.from(this.events.keys())
  }

  listeners(eventName: string | symbol): Function[] {
    const listeners = this.events.get(eventName)
    return listeners ? [...listeners] : []
  }

  listenerCount(eventName: string | symbol): number {
    const listeners = this.events.get(eventName)
    return listeners ? listeners.length : 0
  }

  getMaxListeners(): number {
    return this.maxListeners
  }

  setMaxListeners(n: number): this {
    this.maxListeners = n
    return this
  }

  prependListener(eventName: string | symbol, listener: Function): this {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, [])
    }
    this.events.get(eventName)!.unshift(listener)
    return this
  }

  prependOnceListener(eventName: string | symbol, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(eventName, onceWrapper)
      listener.apply(this, args)
    }
    return this.prependListener(eventName, onceWrapper)
  }
}

// Default export and named export for compatibility
export default EventEmitter

// Static methods and properties to match Node.js EventEmitter
EventEmitter.defaultMaxListeners = 10

// Export commonly used functions
export function once(emitter: EventEmitter, eventName: string | symbol): Promise<any[]> {
  return new Promise((resolve, reject) => {
    function onEvent(...args: any[]) {
      emitter.removeListener('error', onError)
      resolve(args)
    }
    
    function onError(error: Error) {
      emitter.removeListener(eventName, onEvent)
      reject(error)
    }
    
    emitter.once(eventName, onEvent)
    emitter.once('error', onError)
  })
}
