import { useEffect, useRef, useState } from "react";
import { Level } from "../../../game/Level";
import { TileMap, TILE_SIZE, TileDefinition } from "../../../game/TileMap";

const SCALE = 2;
const CELL_SIZE = TILE_SIZE * SCALE;

export function MapGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [tileMap, setTileMap] = useState<TileMap | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const tm = new TileMap();
    const lvl = new Level(100, 100);

    lvl.setupTileDefinitions(tm);
    setTileMap(tm);
    setLevel(lvl);
    generateDungeon();
  }, []);

  const generateDungeon = () => {
    if (!level || !tileMap) return;

    setIsGenerating(true);
    level.procedurallyGenerateLevel();
    renderLevel();
    setIsGenerating(false);
  };

  const renderLevel = () => {
    if (!canvasRef.current || !level || !tileMap) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const width = level.getWidth();
    const height = level.getHeight();

    canvasRef.current.width = width * CELL_SIZE;
    canvasRef.current.height = height * CELL_SIZE;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = level.getTile(x, y);
        if (!tile) continue;

        const tileDef = tileMap.getTileDefinition(tile.bottomTile);
        if (tileDef) {
          drawTile(ctx, tileMap, tileDef, x, y);
        }

        if (tile.shadowTile) {
          const shadowTileDef = tileMap.getTileDefinition(tile.shadowTile);
          if (shadowTileDef) {
            drawTile(ctx, tileMap, shadowTileDef, x, y);
          }
        }

        if (tile.topTile) {
          const topTileDef = tileMap.getTileDefinition(tile.topTile);
          if (topTileDef) {
            drawTile(ctx, tileMap, topTileDef, x, y);
          }
        }
      }
    }
  };

  const drawTile = (
    ctx: CanvasRenderingContext2D,
    tileMap: TileMap,
    tile: TileDefinition,
    gridX: number,
    gridY: number,
  ) => {
    function rgbaToHex(r: number, g: number, b: number, a: number): string {
      const hex = (value: number) =>
        Math.round(value * 255)
          .toString(16)
          .padStart(2, "0");
      return `#${hex(r)}${hex(g)}${hex(b)}${hex(a)}`;
    }
    for (let py = 0; py < TILE_SIZE; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const pixels = tileMap.getTilePixels(tile.name);
        if (!pixels) continue;

        const color = rgbaToHex(
          pixels[py * TILE_SIZE + px].r,
          pixels[py * TILE_SIZE + px].g,
          pixels[py * TILE_SIZE + px].b,
          pixels[py * TILE_SIZE + px].a,
        );
        ctx.fillStyle = color;
        ctx.fillRect(gridX * CELL_SIZE + px * SCALE, gridY * CELL_SIZE + py * SCALE, SCALE, SCALE);
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-8">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold text-white">Dungeon Generator</h1>

        <div className="flex gap-4">
          <button
            onClick={generateDungeon}
            disabled={!level || !tileMap || isGenerating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isGenerating ? "Generating..." : "Generate Dungeon"}
          </button>
        </div>

        <div className="border-4 border-gray-700 rounded-lg overflow-hidden bg-black">
          <canvas ref={canvasRef} className="block" style={{ imageRendering: "pixelated" }} />
        </div>

        <div className="text-gray-400 text-sm">
          Grid: {level ? `${level.getWidth()}x${level.getHeight()}` : "Loading..."} | Tile Size: {TILE_SIZE}px | Scale:{" "}
          {SCALE}x
        </div>
      </div>
    </main>
  );
}

