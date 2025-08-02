import type { TileMap } from "./TileMap.ts"
import * as ROT from "rot-js"

export interface LevelTile {
  bottomTile: string
  solid: boolean
  topTile?: string
  shadowTile?: string
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
  x: number
  y: number
  width: number
  height: number
  type?: "normal" | "treasure" | "boss" | "spawn"
}

export class Level {
  private tiles: LevelTile[][]
  private entities: Entity[] = []
  private rooms: Room[] = []
  private corridors: { x: number; y: number }[] = []

  constructor(
    private width: number,
    private height: number,
  ) {
    this.tiles = []
    for (let y = 0; y < height; y++) {
      this.tiles[y] = []
      for (let x = 0; x < width; x++) {
        this.tiles[y][x] = {
          bottomTile: "void",
          solid: true,
        }
      }
    }
  }

  setTile(x: number, y: number, tile: LevelTile): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y][x] = tile
    }
  }

  getTile(x: number, y: number): LevelTile | null {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.tiles[y][x]
    }
    return null
  }

  isSolid(x: number, y: number): boolean {
    const tile = this.getTile(x, y)
    return tile ? tile.solid : true
  }

  getBottomLayerTiles(): string[][] {
    return this.tiles.map((row) => row.map((tile) => tile.bottomTile))
  }

  getTopLayerTiles(): Array<{ tileName: string; gridX: number; gridY: number }> {
    const topTiles: Array<{ tileName: string; gridX: number; gridY: number }> = []

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x].topTile) {
          topTiles.push({
            tileName: this.tiles[y][x].topTile!,
            gridX: x,
            gridY: y,
          })
        }
      }
    }

    return topTiles
  }

  addEntity(entity: Entity): void {
    this.entities.push(entity)
  }

  removeEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity)
    if (index !== -1) {
      this.entities.splice(index, 1)
    }
  }

  getEntities(): Entity[] {
    return this.entities
  }

  procedurallyGenerateLevel(): void {
    const seed = Date.now().toString()
    ROT.RNG.setSeed(seed)

    const tileGrid: TileType[][] = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => TileType.Empty)
    )

    this.rooms = []
    this.corridors = []

    const digger = new ROT.Map.Digger(this.width, this.height, {
      roomWidth: [5, 15],
      roomHeight: [5, 12],
      corridorLength: [3, 10],
      dugPercentage: 0.3,
    })

    digger.create((x, y, value) => {
      if (value === 0) {
        tileGrid[y][x] = TileType.Floor
        this.corridors.push({ x, y })
      }
    })

    const rooms = digger.getRooms()
    for (const room of rooms) {
      const roomData: Room = {
        x: room.getLeft(),
        y: room.getTop(),
        width: room.getRight() - room.getLeft() + 1,
        height: room.getBottom() - room.getTop() + 1,
        type: "normal",
      }

      if (this.rooms.length === 0) {
        roomData.type = "spawn"
      } else if (this.rooms.length === rooms.length - 1) {
        roomData.type = "boss"
      } else if (Math.random() < 0.15) {
        roomData.type = "treasure"
      }

      this.rooms.push(roomData)

      for (let y = room.getTop(); y <= room.getBottom(); y++) {
        for (let x = room.getLeft(); x <= room.getRight(); x++) {
          tileGrid[y][x] = TileType.Floor
        }
      }
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (tileGrid[y][x] === TileType.Floor) {
          const neighbors = this.getNeighbors(tileGrid, x, y)
          const hasWallNeighbor = neighbors.some((n) => n === TileType.Empty)

          if (hasWallNeighbor && Math.random() < 0.02) {
            const doorNeighbors = [
              tileGrid[y - 1]?.[x],
              tileGrid[y + 1]?.[x],
              tileGrid[y]?.[x - 1],
              tileGrid[y]?.[x + 1],
            ]
            const verticalDoor = doorNeighbors[0] === TileType.Empty && doorNeighbors[1] === TileType.Empty
            const horizontalDoor = doorNeighbors[2] === TileType.Empty && doorNeighbors[3] === TileType.Empty

            if (verticalDoor || horizontalDoor) {
              tileGrid[y][x] = TileType.Door
            }
          }
        }
      }
    }

    this.autotileWalls(tileGrid)

    this.addShadows(tileGrid)

    this.decorateRooms(tileGrid)

    this.placeSpecialFeatures(tileGrid)
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
    ]
  }

  private autotileWalls(grid: TileType[][]): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const current = grid[y][x]

        if (current === TileType.Empty) {
          const n = y > 0 && grid[y - 1][x] === TileType.Empty
          const s = y < this.height - 1 && grid[y + 1][x] === TileType.Empty
          const w = x > 0 && grid[y][x - 1] === TileType.Empty
          const e = x < this.width - 1 && grid[y][x + 1] === TileType.Empty
          const nw = x > 0 && y > 0 && grid[y - 1][x - 1] === TileType.Empty
          const ne = x < this.width - 1 && y > 0 && grid[y - 1][x + 1] === TileType.Empty
          const sw = x > 0 && y < this.height - 1 && grid[y + 1][x - 1] === TileType.Empty
          const se = x < this.width - 1 && y < this.height - 1 && grid[y + 1][x + 1] === TileType.Empty

          let wallType = "wall-block"

          if (!n && !s && !w && !e) {
            wallType = "wall-isolated"
          } else if (n && s && !w && !e) {
            wallType = "wall-vertical"
          } else if (!n && !s && w && e) {
            wallType = "wall-horizontal"
          } else if (n && e && !s && !w) {
            wallType = "wall-corner-nw"
          } else if (n && w && !s && !e) {
            wallType = "wall-corner-ne"
          } else if (s && e && !n && !w) {
            wallType = "wall-corner-sw"
          } else if (s && w && !n && !e) {
            wallType = "wall-corner-se"
          } else if (!n && s && w && e) {
            wallType = "wall-t-north"
          } else if (n && !s && w && e) {
            wallType = "wall-t-south"
          } else if (n && s && !w && e) {
            wallType = "wall-t-west"
          } else if (n && s && w && !e) {
            wallType = "wall-t-east"
          } else if (n && s && w && e) {
            if (!nw && ne && sw && se) {
              wallType = "wall-cross-nw"
            } else if (nw && !ne && sw && se) {
              wallType = "wall-cross-ne"
            } else if (nw && ne && !sw && se) {
              wallType = "wall-cross-sw"
            } else if (nw && ne && sw && !se) {
              wallType = "wall-cross-se"
            } else {
              wallType = "wall-cross"
            }
          }

          this.tiles[y][x] = {
            bottomTile: wallType,
            solid: true,
          }
        } else if (current === TileType.Floor) {
          const room = this.getRoomAt(x, y)
          let floorType = "floor-stone"

          if (room) {
            switch (room.type) {
              case "spawn":
                floorType = Math.random() < 0.1 ? "floor-stone-moss" : "floor-stone"
                break
              case "boss":
                floorType = Math.random() < 0.3 ? "floor-stone-cracked" : "floor-stone-dark"
                break
              case "treasure":
                floorType = Math.random() < 0.2 ? "floor-stone-fancy" : "floor-stone"
                break
              default:
                if (Math.random() < 0.05) floorType = "floor-stone-cracked"
                else if (Math.random() < 0.03) floorType = "floor-stone-moss"
                break
            }
          }

          this.tiles[y][x] = {
            bottomTile: floorType,
            solid: false,
          }
        } else if (current === TileType.Door) {
          this.tiles[y][x] = {
            bottomTile: "floor-stone",
            solid: false,
            topTile: "door-closed",
          }
        }
      }
    }
  }

  private addShadows(grid: TileType[][]): void {
    for (let y = 1; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (grid[y][x] === TileType.Floor && grid[y - 1][x] === TileType.Empty) {
          const leftWall = x > 0 && grid[y - 1][x - 1] === TileType.Empty
          const rightWall = x < this.width - 1 && grid[y - 1][x + 1] === TileType.Empty

          let shadowType = "shadow-north"
          if (leftWall && !rightWall) {
            shadowType = "shadow-north-west"
          } else if (!leftWall && rightWall) {
            shadowType = "shadow-north-east"
          } else if (leftWall && rightWall) {
            shadowType = "shadow-north-full"
          }

          this.tiles[y][x].shadowTile = shadowType
        }

        if (x > 0 && grid[y][x] === TileType.Floor && grid[y][x - 1] === TileType.Empty) {
          if (!this.tiles[y][x].shadowTile) {
            this.tiles[y][x].shadowTile = "shadow-west"
          }
        }
      }
    }
  }

  private decorateRooms(grid: TileType[][]): void {
    for (const room of this.rooms) {
      const decorationChance = room.type === "treasure" ? 0.15 : 0.05

      for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
          if (grid[y][x] !== TileType.Floor || this.tiles[y][x].topTile) continue

          const neighbors = this.getNeighbors(grid, x, y)
          const nearWall = neighbors.some((n) => n === TileType.Empty)

          if (Math.random() < decorationChance) {
            const decorations = this.getDecorationsForRoom(room.type || "normal", nearWall)
            const decoration = decorations[Math.floor(Math.random() * decorations.length)]

            this.tiles[y][x].topTile = decoration.tile
            this.tiles[y][x].solid = decoration.solid
          }
        }
      }

      if (room.type === "treasure") {
        const centerX = Math.floor(room.x + room.width / 2)
        const centerY = Math.floor(room.y + room.height / 2)
        if (grid[centerY][centerX] === TileType.Floor) {
          this.tiles[centerY][centerX].topTile = "chest-closed"
          this.tiles[centerY][centerX].solid = true
        }
      }

      if (room.type === "boss") {
        const positions = [
          { x: room.x + 1, y: room.y + 1 },
          { x: room.x + room.width - 2, y: room.y + 1 },
          { x: room.x + 1, y: room.y + room.height - 2 },
          { x: room.x + room.width - 2, y: room.y + room.height - 2 },
        ]

        for (const pos of positions) {
          if (grid[pos.y][pos.x] === TileType.Floor) {
            this.tiles[pos.y][pos.x].topTile = "brazier-lit"
            this.tiles[pos.y][pos.x].solid = true
          }
        }
      }
    }
  }

  private getDecorationsForRoom(
    roomType: string,
    nearWall: boolean,
  ): Array<{ tile: string; solid: boolean }> {
    const wallDecorations = [
      { tile: "torch-wall", solid: false },
      { tile: "banner-red", solid: false },
      { tile: "banner-blue", solid: false },
    ]

    const floorDecorations = [
      { tile: "barrel", solid: true },
      { tile: "crate", solid: true },
      { tile: "pot", solid: true },
      { tile: "bones", solid: false },
      { tile: "skull", solid: false },
      { tile: "rubble", solid: false },
      { tile: "web", solid: false },
    ]

    if (roomType === "treasure") {
      floorDecorations.push(
        { tile: "coins", solid: false },
        { tile: "gem-red", solid: false },
        { tile: "gem-blue", solid: false },
      )
    }

    if (roomType === "boss") {
      floorDecorations.push(
        { tile: "pillar", solid: true },
        { tile: "statue", solid: true },
      )
    }

    return nearWall && Math.random() < 0.3 ? wallDecorations : floorDecorations
  }

  private placeSpecialFeatures(grid: TileType[][]): void {
    if (this.rooms.length > 0) {
      const spawnRoom = this.rooms.find((r) => r.type === "spawn")
      if (spawnRoom) {
        const centerX = Math.floor(spawnRoom.x + spawnRoom.width / 2)
        const centerY = Math.floor(spawnRoom.y + spawnRoom.height / 2)
        if (grid[centerY][centerX] === TileType.Floor) {
          this.tiles[centerY][centerX].topTile = "stairs-up"
          this.tiles[centerY][centerX].solid = false
        }
      }

      const bossRoom = this.rooms.find((r) => r.type === "boss")
      if (bossRoom) {
        const centerX = Math.floor(bossRoom.x + bossRoom.width / 2)
        const centerY = Math.floor(bossRoom.y + bossRoom.height / 2)
        if (grid[centerY][centerX] === TileType.Floor) {
          this.tiles[centerY][centerX].topTile = "stairs-down"
          this.tiles[centerY][centerX].solid = false
        }
      }
    }
  }

  private getRoomAt(x: number, y: number): Room | null {
    for (const room of this.rooms) {
      if (x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height) {
        return room
      }
    }
    return null
  }

  setupTileDefinitions(tileMap: TileMap): void {
    tileMap.loadFromFile("tilemap_packed.png")

    tileMap.defineTile("void", 10, 10, { layer: "bottom" })

    tileMap.defineTile("floor-stone", 1, 0, { layer: "bottom" })
    tileMap.defineTile("floor-stone-cracked", 2, 0, { layer: "bottom" })
    tileMap.defineTile("floor-stone-moss", 3, 0, { layer: "bottom" })
    tileMap.defineTile("floor-stone-dark", 4, 0, { layer: "bottom" })
    tileMap.defineTile("floor-stone-fancy", 0, 1, { layer: "bottom" })

    tileMap.defineTile("wall-block", 0, 3, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-isolated", 1, 3, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-vertical", 2, 3, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-horizontal", 3, 3, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-corner-nw", 0, 4, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-corner-ne", 1, 4, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-corner-sw", 2, 4, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-corner-se", 3, 4, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-t-north", 4, 3, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-t-south", 5, 3, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-t-west", 6, 3, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-t-east", 7, 3, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-cross", 4, 4, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-cross-nw", 5, 4, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-cross-ne", 6, 4, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-cross-sw", 7, 4, { layer: "bottom", solid: true })
    tileMap.defineTile("wall-cross-se", 8, 4, { layer: "bottom", solid: true })

    tileMap.defineTile("shadow-north", 0, 2, { layer: "sprite" })
    tileMap.defineTile("shadow-north-west", 1, 2, { layer: "sprite" })
    tileMap.defineTile("shadow-north-east", 2, 2, { layer: "sprite" })
    tileMap.defineTile("shadow-north-full", 3, 2, { layer: "sprite" })
    tileMap.defineTile("shadow-west", 4, 2, { layer: "sprite" })

    tileMap.defineTile("door-closed", 5, 1, { layer: "sprite" })
    tileMap.defineTile("door-open", 6, 1, { layer: "sprite" })
    tileMap.defineTile("stairs-up", 7, 1, { layer: "sprite" })
    tileMap.defineTile("stairs-down", 8, 1, { layer: "sprite" })

    tileMap.defineTile("chest-closed", 9, 0, { layer: "sprite" })
    tileMap.defineTile("chest-open", 10, 0, { layer: "sprite" })
    tileMap.defineTile("barrel", 11, 0, { layer: "sprite" })
    tileMap.defineTile("crate", 12, 0, { layer: "sprite" })
    tileMap.defineTile("pot", 13, 0, { layer: "sprite" })

    tileMap.defineTile("torch-wall", 5, 2, { layer: "sprite" })
    tileMap.defineTile("brazier-lit", 6, 2, { layer: "sprite" })
    tileMap.defineTile("banner-red", 7, 2, { layer: "sprite" })
    tileMap.defineTile("banner-blue", 8, 2, { layer: "sprite" })

    tileMap.defineTile("bones", 9, 1, { layer: "sprite" })
    tileMap.defineTile("skull", 10, 1, { layer: "sprite" })
    tileMap.defineTile("rubble", 11, 1, { layer: "sprite" })
    tileMap.defineTile("web", 12, 1, { layer: "sprite" })

    tileMap.defineTile("coins", 9, 2, { layer: "sprite" })
    tileMap.defineTile("gem-red", 10, 2, { layer: "sprite" })
    tileMap.defineTile("gem-blue", 11, 2, { layer: "sprite" })

    tileMap.defineTile("pillar", 14, 0, { layer: "sprite" })
    tileMap.defineTile("statue", 15, 0, { layer: "sprite" })

    tileMap.defineTile("player", 1, 18, { layer: "sprite" })
  }

  getWidth(): number {
    return this.width
  }

  getHeight(): number {
    return this.height
  }
}

export interface Entity {
  gridX: number
  gridY: number
  subX?: number
  subY?: number
  width: number
  height: number
  tileName: string
  layer: "sprite"
  facingLeft?: boolean
}
