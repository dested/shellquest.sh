import { BrowserRenderer } from "./BrowserRenderer";
import { getKeyHandler } from "../core/ui/lib/KeyHandler";
// Create a browser-compatible version of createCliRenderer
export async function createBrowserRenderer(config: any = {}): Promise<BrowserRenderer> {
  const container = document.getElementById("terminal-container") as HTMLDivElement;
  if (!container) {
    throw new Error("Container element not found");
  }

  // Default terminal size
  const width = 300;
  const height = 200;

  const renderer = new BrowserRenderer(container, width, height, config);

  // Initialize key handler
  const keyHandler = getKeyHandler();

  // Forward browser key events to key handler
  renderer.on("key", (key: any) => {
    keyHandler.emit("keypress", key);

    // Track key states for keydown/keyup
    if (!key.meta && !key.ctrl) {
      keyHandler.emit("keydown", key);

      // Simulate keyup after a short delay (browser doesn't give us keyup for all keys)
      setTimeout(() => {
        keyHandler.emit("keyup", key);
      }, 100);
    }
  });

  return renderer;
}

// Initialize the game
async function init() {
  console.log("Initializing browser renderer...");

  try {
    const renderer = await createBrowserRenderer({
      exitOnCtrlC: false,
      targetFps: 30,
    });

    renderer.setBackgroundColor("#000000");

    // Import and run the game
    const { run } = await import("../crawler");
    await run(renderer);

    renderer.start();

    console.log("Game started successfully!");
  } catch (error) {
    console.error("Failed to initialize game:", error);
  }
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
