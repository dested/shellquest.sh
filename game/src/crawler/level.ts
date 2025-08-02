import type { Entity } from "./tilemap/LayeredRenderer"
import type { TileMap } from "./tilemap/TileMap.ts"
import * as ROT from "rot-js";

export interface LevelTile {
  bottomTile: string;
  solid: boolean;
  topTile?: string;
  shadowTile?: string;
}

export enum TileType {
  Empty = 0,
  Floor = 1,
  Wall = 2,
  Door = 3,
  Chest = 4,
  Stairs = 5,
}

interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: "normal" | "treasure" | "boss" | "spawn";
}

export class Level {
  private tiles: LevelTile[][];
  private entities: Entity[] = [];
  private rooms: Room[] = [];
  private corridors: { x: number; y: number }[] = [];

  constructor(
    private width: number,
    private height: number,
  ) {
    this.tiles = [];
    for (let y = 0; y < height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < width; x++) {
        this.tiles[y][x] = {
          bottomTile: "void",
          solid: true,
        };
      }
    }
  }

  setTile(x: number, y: number, tile: LevelTile): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y][x] = tile;
    }
  }

  getTile(x: number, y: number): LevelTile | null {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.tiles[y][x];
    }
    return null;
  }

  isSolid(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.solid : true;
  }

  getBottomLayerTiles(): string[][] {
    return this.tiles.map((row) => row.map((tile) => tile.bottomTile));
  }

  getTopLayerTiles(): Array<{ tileName: string; gridX: number; gridY: number }> {
    const topTiles: Array<{ tileName: string; gridX: number; gridY: number }> = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x].topTile) {
          topTiles.push({
            tileName: this.tiles[y][x].topTile!,
            gridX: x,
            gridY: y,
          });
        }
      }
    }

    return topTiles;
  }

  addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  removeEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }

  getEntities(): Entity[] {
    return this.entities;
  }

  procedurallyGenerateLevel(): void {
    const seed = Date.now();
    ROT.RNG.setSeed(+seed);

    const tileGrid: TileType[][] = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => TileType.Empty),
    );

    this.rooms = [];
    this.corridors = [];

    const digger = new ROT.Map.Digger(this.width, this.height, {
      roomWidth: [5, 15],
      roomHeight: [5, 12],
      corridorLength: [3, 10],
      dugPercentage: 0.3,
    });

    digger.create((x, y, value) => {
      if (value === 0) {
        tileGrid[y][x] = TileType.Floor;
        this.corridors.push({ x, y });
      }
    });

    const rooms = digger.getRooms();
    for (const room of rooms) {
      const roomData: Room = {
        x: room.getLeft(),
        y: room.getTop(),
        width: room.getRight() - room.getLeft() + 1,
        height: room.getBottom() - room.getTop() + 1,
        type: "normal",
      };

      if (this.rooms.length === 0) {
        roomData.type = "spawn";
      } else if (this.rooms.length === rooms.length - 1) {
        roomData.type = "boss";
      } else if (Math.random() < 0.15) {
        roomData.type = "treasure";
      }

      this.rooms.push(roomData);

      for (let y = room.getTop(); y <= room.getBottom(); y++) {
        for (let x = room.getLeft(); x <= room.getRight(); x++) {
          tileGrid[y][x] = TileType.Floor;
        }
      }
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (tileGrid[y][x] === TileType.Floor) {
          const neighbors = this.getNeighbors(tileGrid, x, y);
          const hasWallNeighbor = neighbors.some((n) => n === TileType.Empty);

          if (hasWallNeighbor && Math.random() < 0.02) {
            const doorNeighbors = [
              tileGrid[y - 1]?.[x],
              tileGrid[y + 1]?.[x],
              tileGrid[y]?.[x - 1],
              tileGrid[y]?.[x + 1],
            ];
            const verticalDoor = doorNeighbors[0] === TileType.Empty && doorNeighbors[1] === TileType.Empty;
            const horizontalDoor = doorNeighbors[2] === TileType.Empty && doorNeighbors[3] === TileType.Empty;

            if (verticalDoor || horizontalDoor) {
              tileGrid[y][x] = TileType.Door;
            }
          }
        }
      }
    }

    this.autotileWalls(tileGrid);

    this.addShadows(tileGrid);

    this.decorateRooms(tileGrid);

    this.placeSpecialFeatures(tileGrid);
  }

  private getNeighbors(grid: TileType[][], x: number, y: number): (TileType | undefined)[] {
    return [
      grid[y - 1]?.[x],
      grid[y + 1]?.[x],
      grid[y]?.[x - 1],
      grid[y]?.[x + 1],
      grid[y - 1]?.[x - 1],
      grid[y - 1]?.[x + 1],
      grid[y + 1]?.[x - 1],
      grid[y + 1]?.[x + 1],
    ];
  }

  private autotileWalls(grid: TileType[][]): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const current = grid[y][x];

        if (current === TileType.Empty) {
          const n = y > 0 && grid[y - 1][x] === TileType.Empty;
          const s = y < this.height - 1 && grid[y + 1][x] === TileType.Empty;
          const w = x > 0 && grid[y][x - 1] === TileType.Empty;
          const e = x < this.width - 1 && grid[y][x + 1] === TileType.Empty;
          const nw = x > 0 && y > 0 && grid[y - 1][x - 1] === TileType.Empty;
          const ne = x < this.width - 1 && y > 0 && grid[y - 1][x + 1] === TileType.Empty;
          const sw = x > 0 && y < this.height - 1 && grid[y + 1][x - 1] === TileType.Empty;
          const se = x < this.width - 1 && y < this.height - 1 && grid[y + 1][x + 1] === TileType.Empty;

          let wallType = "wall-block";

          if (!n && !s && !w && !e) {
            wallType = "wall-isolated";
          } else if (n && s && !w && !e) {
            wallType = "wall-vertical";
          } else if (!n && !s && w && e) {
            wallType = "wall-horizontal";
          } else if (n && e && !s && !w) {
            wallType = "wall-corner-nw";
          } else if (n && w && !s && !e) {
            wallType = "wall-corner-ne";
          } else if (s && e && !n && !w) {
            wallType = "wall-corner-sw";
          } else if (s && w && !n && !e) {
            wallType = "wall-corner-se";
          } else if (!n && s && w && e) {
            wallType = "wall-t-north";
          } else if (n && !s && w && e) {
            wallType = "wall-t-south";
          } else if (n && s && !w && e) {
            wallType = "wall-t-west";
          } else if (n && s && w && !e) {
            wallType = "wall-t-east";
          } else if (n && s && w && e) {
            if (!nw && ne && sw && se) {
              wallType = "wall-cross-nw";
            } else if (nw && !ne && sw && se) {
              wallType = "wall-cross-ne";
            } else if (nw && ne && !sw && se) {
              wallType = "wall-cross-sw";
            } else if (nw && ne && sw && !se) {
              wallType = "wall-cross-se";
            } else {
              wallType = "wall-cross";
            }
          }

          this.tiles[y][x] = {
            bottomTile: wallType,
            solid: true,
          };
        } else if (current === TileType.Floor) {
          const room = this.getRoomAt(x, y);
          let floorType = "floor-stone";

          if (room) {
            switch (room.type) {
              case "spawn":
                floorType = Math.random() < 0.1 ? "floor-stone-moss" : "floor-stone";
                break;
              case "boss":
                floorType = Math.random() < 0.3 ? "floor-stone-cracked" : "floor-stone-dark";
                break;
              case "treasure":
                floorType = Math.random() < 0.2 ? "floor-stone-fancy" : "floor-stone";
                break;
              default:
                if (Math.random() < 0.05) floorType = "floor-stone-cracked";
                else if (Math.random() < 0.03) floorType = "floor-stone-moss";
                break;
            }
          }

          this.tiles[y][x] = {
            bottomTile: floorType,
            solid: false,
          };
        } else if (current === TileType.Door) {
          this.tiles[y][x] = {
            bottomTile: "floor-stone",
            solid: false,
            topTile: "door-closed",
          };
        }
      }
    }
  }

  private addShadows(grid: TileType[][]): void {
    for (let y = 1; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (grid[y][x] === TileType.Floor && grid[y - 1][x] === TileType.Empty) {
          const leftWall = x > 0 && grid[y - 1][x - 1] === TileType.Empty;
          const rightWall = x < this.width - 1 && grid[y - 1][x + 1] === TileType.Empty;

          let shadowType = "shadow-north";
          if (leftWall && !rightWall) {
            shadowType = "shadow-north-west";
          } else if (!leftWall && rightWall) {
            shadowType = "shadow-north-east";
          } else if (leftWall && rightWall) {
            shadowType = "shadow-north-full";
          }

          this.tiles[y][x].shadowTile = shadowType;
        }

        if (x > 0 && grid[y][x] === TileType.Floor && grid[y][x - 1] === TileType.Empty) {
          if (!this.tiles[y][x].shadowTile) {
            this.tiles[y][x].shadowTile = "shadow-west";
          }
        }
      }
    }
  }

  private decorateRooms(grid: TileType[][]): void {
    for (const room of this.rooms) {
      const decorationChance = room.type === "treasure" ? 0.15 : 0.05;

      for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
          if (grid[y][x] !== TileType.Floor || this.tiles[y][x].topTile) continue;

          const neighbors = this.getNeighbors(grid, x, y);
          const nearWall = neighbors.some((n) => n === TileType.Empty);

          if (Math.random() < decorationChance) {
            const decorations = this.getDecorationsForRoom(room.type || "normal", nearWall);
            const decoration = decorations[Math.floor(Math.random() * decorations.length)];

            this.tiles[y][x].topTile = decoration.tile;
            this.tiles[y][x].solid = decoration.solid;
          }
        }
      }

      if (room.type === "treasure") {
        const centerX = Math.floor(room.x + room.width / 2);
        const centerY = Math.floor(room.y + room.height / 2);
        if (grid[centerY][centerX] === TileType.Floor) {
          this.tiles[centerY][centerX].topTile = "chest-closed";
          this.tiles[centerY][centerX].solid = true;
        }
      }

      if (room.type === "boss") {
        const positions = [
          { x: room.x + 1, y: room.y + 1 },
          { x: room.x + room.width - 2, y: room.y + 1 },
          { x: room.x + 1, y: room.y + room.height - 2 },
          { x: room.x + room.width - 2, y: room.y + room.height - 2 },
        ];

        for (const pos of positions) {
          if (grid[pos.y][pos.x] === TileType.Floor) {
            this.tiles[pos.y][pos.x].topTile = "brazier-lit";
            this.tiles[pos.y][pos.x].solid = true;
          }
        }
      }
    }
  }

  private getDecorationsForRoom(roomType: string, nearWall: boolean): Array<{ tile: string; solid: boolean }> {
    const wallDecorations = [
      { tile: "torch-wall", solid: false },
      { tile: "banner-red", solid: false },
      { tile: "banner-blue", solid: false },
    ];

    const floorDecorations = [
      { tile: "barrel", solid: true },
      { tile: "crate", solid: true },
      { tile: "pot", solid: true },
      { tile: "bones", solid: false },
      { tile: "skull", solid: false },
      { tile: "rubble", solid: false },
      { tile: "web", solid: false },
    ];

    if (roomType === "treasure") {
      floorDecorations.push(
        { tile: "coins", solid: false },
        { tile: "gem-red", solid: false },
        { tile: "gem-blue", solid: false },
      );
    }

    if (roomType === "boss") {
      floorDecorations.push({ tile: "pillar", solid: true }, { tile: "statue", solid: true });
    }

    return nearWall && Math.random() < 0.3 ? wallDecorations : floorDecorations;
  }

  private placeSpecialFeatures(grid: TileType[][]): void {
    if (this.rooms.length > 0) {
      const spawnRoom = this.rooms.find((r) => r.type === "spawn");
      if (spawnRoom) {
        const centerX = Math.floor(spawnRoom.x + spawnRoom.width / 2);
        const centerY = Math.floor(spawnRoom.y + spawnRoom.height / 2);
        if (grid[centerY][centerX] === TileType.Floor) {
          this.tiles[centerY][centerX].topTile = "stairs-up";
          this.tiles[centerY][centerX].solid = false;
        }
      }

      const bossRoom = this.rooms.find((r) => r.type === "boss");
      if (bossRoom) {
        const centerX = Math.floor(bossRoom.x + bossRoom.width / 2);
        const centerY = Math.floor(bossRoom.y + bossRoom.height / 2);
        if (grid[centerY][centerX] === TileType.Floor) {
          this.tiles[centerY][centerX].topTile = "stairs-down";
          this.tiles[centerY][centerX].solid = false;
        }
      }
    }
  }

  private getRoomAt(x: number, y: number): Room | null {
    for (const room of this.rooms) {
      if (x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height) {
        return room;
      }
    }
    return null;
  }

  setupTileDefinitions(tileMap: TileMap): void {
    tileMap.loadFromFile("tilemap_packed.png");

    //https://claude.ai/public/artifacts/bbc81e9f-b72b-46f3-b877-b5dddd263ddc?fullscreen=true
    // prettier-ignore
    const tiles: {
      name: string;
      x: number;
      y: number;
      layer: "bottom" | "sprite";
      solid?: boolean;
      flipX?: boolean;
      flipY?: boolean;
    }[] = [
      {
        "name": "void",
        "x": 0,
        "y": 22,
        "layer": "bottom",
        "solid": false,
        "flipX": false,
        "flipY": false
      },
      {
        "name": "floor-stone",
        "x": 1,
        "y": 9,
        "layer": "bottom"
      },
      {
        "name": "floor-stone-cracked",
        "x": 1,
        "y": 9,
        "layer": "bottom"
      },
      {
        "name": "floor-stone-moss",
        "x": 1,
        "y": 9,
        "layer": "bottom"
      },
      {
        "name": "floor-stone-dark",
        "x": 1,
        "y": 9,
        "layer": "bottom"
      },
      {
        "name": "floor-stone-fancy",
        "x": 1,
        "y": 9,
        "layer": "bottom"
      },
      {
        "name": "wall-block",
        "x": 4,
        "y": 14,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-isolated",
        "x": 4,
        "y": 14,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-vertical",
        "x": 9,
        "y": 15,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-horizontal",
        "x": 10,
        "y": 15,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-corner-nw",
        "x": 0,
        "y": 8,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-corner-ne",
        "x": 2,
        "y": 8,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-corner-sw",
        "x": 0,
        "y": 10,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-corner-se",
        "x": 2,
        "y": 10,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-t-north",
        "x": 1,
        "y": 8,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-t-south",
        "x": 1,
        "y": 10,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-t-west",
        "x": 0,
        "y": 9,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-t-east",
        "x": 2,
        "y": 9,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-cross",
        "x": 6,
        "y": 10,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-cross-nw",
        "x": 5,
        "y": 4,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-cross-ne",
        "x": 6,
        "y": 4,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-cross-sw",
        "x": 7,
        "y": 4,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "wall-cross-se",
        "x": 8,
        "y": 4,
        "layer": "bottom",
        "solid": true
      },
      {
        "name": "shadow-north",
        "x": 2,
        "y": 15,
        "layer": "bottom"
      },
      {
        "name": "shadow-north-west",
        "x": 4,
        "y": 15,
        "layer": "bottom"
      },
      {
        "name": "shadow-north-east",
        "x": 2,
        "y": 2,
        "layer": "bottom"
      },
      {
        "name": "shadow-north-full",
        "x": 3,
        "y": 2,
        "layer": "bottom"
      },
      {
        "name": "shadow-west",
        "x": 4,
        "y": 2,
        "layer": "bottom"
      },
      {
        "name": "door-closed",
        "x": 5,
        "y": 7,
        "layer": "sprite"
      },
      {
        "name": "door-open",
        "x": 6,
        "y": 6,
        "layer": "sprite"
      },
      {
        "name": "stairs-up",
        "x": 3,
        "y": 14,
        "layer": "sprite"
      },
      {
        "name": "stairs-down",
        "x": 3,
        "y": 14,
        "layer": "sprite"
      },
      {
        "name": "chest-closed",
        "x": 5,
        "y": 18,
        "layer": "sprite"
      },
      {
        "name": "chest-open",
        "x": 7,
        "y": 18,
        "layer": "sprite"
      },
      {
        "name": "barrel",
        "x": 10,
        "y": 17,
        "layer": "sprite"
      },
      {
        "name": "crate",
        "x": 3,
        "y": 16,
        "layer": "sprite"
      },
      {
        "name": "pot",
        "x": 11,
        "y": 8,
        "layer": "sprite"
      },
      {
        "name": "torch-wall",
        "x": 8,
        "y": 11,
        "layer": "sprite"
      },
      {
        "name": "brazier-lit",
        "x": 1,
        "y": 21,
        "layer": "sprite"
      },
      {
        "name": "banner-red",
        "x": 0,
        "y": 7,
        "layer": "sprite"
      },
      {
        "name": "banner-blue",
        "x": 4,
        "y": 7,
        "layer": "sprite"
      },
      {
        "name": "bones",
        "x": 0,
        "y": 13,
        "layer": "sprite"
      },
      {
        "name": "skull",
        "x": 9,
        "y": 8,
        "layer": "sprite"
      },
      {
        "name": "rubble",
        "x": 6,
        "y": 14,
        "layer": "sprite"
      },
      {
        "name": "web",
        "x": 2,
        "y": 12,
        "layer": "sprite"
      },
      {
        "name": "coins",
        "x": 9,
        "y": 7,
        "layer": "sprite"
      },
      {
        "name": "gem-red",
        "x": 10,
        "y": 7,
        "layer": "sprite"
      },
      {
        "name": "gem-blue",
        "x": 11,
        "y": 7,
        "layer": "sprite"
      },
      {
        "name": "pillar",
        "x": 7,
        "y": 13,
        "layer": "sprite"
      },
      {
        "name": "statue",
        "x": 5,
        "y": 14,
        "layer": "sprite"
      },
      {
        "name": "player",
        "x": 0,
        "y": 18,
        "layer": "sprite"
      }
    ];

    for (const tile of tiles) {
      tileMap.defineTile(tile.name, tile.x, tile.y, {
        layer: tile.layer,
        solid: tile.solid,
        flipX: tile.flipX,
        flipY: tile.flipY,
      });
    }
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}

