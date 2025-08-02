#!/usr/bin/env bun
import { Game } from "./Game";
import fs from "node:fs";

async function main() {
  const game = new Game();

  process.on("SIGINT", async () => {
    console.log("\nReceived SIGINT, cleaning up...");
    await game.cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\nReceived SIGTERM, cleaning up...");
    await game.cleanup();
    process.exit(0);
  });

  try {
    await game.init();
  } catch (error) {
    fs.writeFileSync("error.log", `Error initializing game:\n${error} ${error.stack}\n`, { flag: "a" });
    console.clear();
    console.error("Failed to initialize game:", error);
    await game.cleanup();
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
