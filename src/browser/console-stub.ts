// Stub for TerminalConsole in browser
export class TerminalConsole {
  constructor(renderer: any, options?: any) {}
  
  toggle(): void {
    console.log('Console toggled')
  }
  
  renderToBuffer(buffer: any): void {}
  
  deactivate(): void {}
  
  resize(width: number, height: number): void {}
  
  dumpCache(): void {}
}

export type ConsoleOptions = any