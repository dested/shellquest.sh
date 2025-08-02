import { CliRenderer, createCliRenderer, GroupRenderable, type ParsedKey, type MouseEvent } from "../core";
import { getKeyHandler } from "../core/ui/lib/KeyHandler";
import { StateManager } from "./states/StateManager";
import { SplashState } from "./states/SplashState";
import { GAME_CONFIG } from "./constants";

export class Game {
  private renderer: CliRenderer | null = null;
  private stateManager: StateManager | null = null;
  private rootContainer: GroupRenderable;
  private keyHandler: any;
  private isRunning: boolean = false;

  constructor() {
    this.rootContainer = new GroupRenderable("root", {
      x: 0,
      y: 0,
      zIndex: 0,
      visible: true,
    });
    this.keyHandler = getKeyHandler();
  }

  async init(): Promise<void> {
    this.checkTerminalSize();
    // Create renderer
    this.renderer = await createCliRenderer({
      targetFps: GAME_CONFIG.RENDER_FPS,
      useMouse: false,
      enableMouseMovement: false,
      exitOnCtrlC: true,
    });
    this.stateManager = new StateManager(this.renderer, this.rootContainer);

    this.renderer.add(this.rootContainer);
    this.renderer.setBackgroundColor("#000000");

    this.setupInputHandling();

    this.stateManager.push(new SplashState());

    this.isRunning = true;
    this.renderer.start();
  }

  private checkTerminalSize(): void {
    const columns = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;

    if (columns < GAME_CONFIG.MIN_TERMINAL_WIDTH || rows < GAME_CONFIG.MIN_TERMINAL_HEIGHT) {
      console.clear();
      console.log("╔════════════════════════════════════════════════════════╗");
      console.log("║                   TERMINAL TOO SMALL                    ║");
      console.log("╠════════════════════════════════════════════════════════╣");
      console.log(
        `║  Required: ${GAME_CONFIG.MIN_TERMINAL_WIDTH}x${GAME_CONFIG.MIN_TERMINAL_HEIGHT} characters                           ║`,
      );
      console.log(`║  Current:  ${columns}x${rows} characters                            ║`);
      console.log("║                                                          ║");
      console.log("║  Please resize your terminal window and restart.        ║");
      console.log("╚════════════════════════════════════════════════════════╝");
      process.exit(1);
    }
  }

  private setupInputHandling(): void {
    if (!this.renderer || !this.stateManager) return;

    this.keyHandler.on("keypress", (key: ParsedKey) => {
      if (!this.isRunning || !this.stateManager) return;

      if (key.ctrl && key.name === "c") {
        this.cleanup();
        process.exit(0);
      }

      try{
        this.stateManager.handleInput(key);
      }catch(ex){
        console.error("Error handling keypress:", ex);
      }
    });

    this.renderer.on("mouse", (event: MouseEvent) => {
      if (!this.isRunning || !this.stateManager) return;
      this.stateManager.handleMouse(event);
    });
  }

  async cleanup(): Promise<void> {
    this.isRunning = false;
    if (this.stateManager) {
      this.stateManager.cleanup();
    }
    if (this.renderer) {
      this.renderer.stop();
    }
  }
}
