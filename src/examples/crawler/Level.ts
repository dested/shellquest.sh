import { Entity } from "./tilemap/LayeredRenderer"
import type { TileMap } from "./tilemap/TileMap.ts"

export interface LevelTile {
  bottomTile: string // Tile name for bottom layer
  solid: boolean // Is this tile solid for collision?
  topTile?: string // Optional overlay tile
}

export class Level {
  private tiles: LevelTile[][]
  private entities: Entity[] = []

  constructor(
    private width: number,
    private height: number,
  ) {
    // Initialize empty level
    this.tiles = []
    for (let y = 0; y < height; y++) {
      this.tiles[y] = []
      for (let x = 0; x < width; x++) {
        this.tiles[y][x] = {
          bottomTile: "grass",
          solid: false,
        }
      }
    }
  }

  /**
   * Set a tile at a specific position
   */
  setTile(x: number, y: number, tile: LevelTile): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y][x] = tile
    }
  }

  /**
   * Get a tile at a specific position
   */
  getTile(x: number, y: number): LevelTile | null {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.tiles[y][x]
    }
    return null
  }

  /**
   * Check if a position is solid
   */
  isSolid(x: number, y: number): boolean {
    return false;
    const tile = this.getTile(x, y)
    return tile ? tile.solid : true
  }

  /**
   * Get bottom layer tiles for rendering
   */
  getBottomLayerTiles(): string[][] {
    return this.tiles.map((row) => row.map((tile) => tile.bottomTile))
  }

  /**
   * Get top layer tiles for rendering
   */
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

  /**
   * Add an entity to the level
   */
  addEntity(entity: Entity): void {
    this.entities.push(entity)
  }

  /**
   * Remove an entity from the level
   */
  removeEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity)
    if (index !== -1) {
      this.entities.splice(index, 1)
    }
  }

  /**
   * Get all entities
   */
  getEntities(): Entity[] {
    return this.entities
  }

  /**
   * Generate a simple test level
   */
  procedurallyGenerateLevel(): void {
    // Initialize with dirt
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
/*
        this.tiles[y][x] = {
          bottomTile: "dirt-full",
          solid: true,
        }
*/
      }
    }

    // Room parameters
    const minRoomSize = 4
    const maxRoomSize = 12
    const roomAttempts = 300
    const rooms: Array<{x: number, y: number, w: number, h: number}> = []
    
    // Generate rooms
    for (let i = 0; i < roomAttempts; i++) {
      const roomWidth = Math.floor(Math.random() * (maxRoomSize - minRoomSize)) + minRoomSize
      const roomHeight = Math.floor(Math.random() * (maxRoomSize - minRoomSize)) + minRoomSize
      const roomX = Math.floor(Math.random() * (this.width - roomWidth - 2)) + 1
      const roomY = Math.floor(Math.random() * (this.height - roomHeight - 2)) + 1
      
      // Check if room overlaps with existing rooms
      let overlaps = false
      for (const room of rooms) {
        if (roomX < room.x + room.w + 2 && 
            roomX + roomWidth + 2 > room.x &&
            roomY < room.y + room.h + 2 && 
            roomY + roomHeight + 2 > room.y) {
          overlaps = true
          break
        }
      }
      
      if (!overlaps) {
        rooms.push({x: roomX, y: roomY, w: roomWidth, h: roomHeight})
        
        // Carve out the room
        for (let y = roomY; y < roomY + roomHeight; y++) {
          for (let x = roomX; x < roomX + roomWidth; x++) {
            // Use different floor types for variety
            const floorType = Math.random()
            let tileName = "grass"
            
            if (floorType < 0.6) {
              tileName = "grass"
            } else if (floorType < 0.85) {
              tileName = "grass-splotchy"
            } else {
              tileName = "grass-full"
            }
            
            // Special patterns in larger rooms
            if (roomWidth > 8 && roomHeight > 8) {
              const centerX = roomX + Math.floor(roomWidth / 2)
              const centerY = roomY + Math.floor(roomHeight / 2)
              const distFromCenter = Math.abs(x - centerX) + Math.abs(y - centerY)
              
              if (distFromCenter < 3) {
                tileName = "dirt-splotchy"
              } else if (distFromCenter < 5 && Math.random() < 0.3) {
                tileName = "dirt"
              }
            }
            
            this.tiles[y][x] = {
              bottomTile: tileName,
              solid: false,
            }
          }
        }
        
        // Add decorations to rooms
        this.decorateRoom(roomX, roomY, roomWidth, roomHeight)
      }
    }
    
    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
      const roomA = rooms[i]
      const roomB = rooms[i + 1]
      
      const centerAX = Math.floor(roomA.x + roomA.w / 2)
      const centerAY = Math.floor(roomA.y + roomA.h / 2)
      const centerBX = Math.floor(roomB.x + roomB.w / 2)
      const centerBY = Math.floor(roomB.y + roomB.h / 2)
      
      // Create L-shaped corridor
      if (Math.random() < 0.5) {
        // Horizontal first, then vertical
        this.carveHorizontalCorridor(centerAX, centerBX, centerAY)
        this.carveVerticalCorridor(centerBX, centerAY, centerBY)
      } else {
        // Vertical first, then horizontal
        this.carveVerticalCorridor(centerAX, centerAY, centerBY)
        this.carveHorizontalCorridor(centerAX, centerBX, centerBY)
      }
    }
    
    // Add some extra connections for interesting topology
    for (let i = 0; i < Math.min(5, rooms.length / 3); i++) {
      const roomA = rooms[Math.floor(Math.random() * rooms.length)]
      const roomB = rooms[Math.floor(Math.random() * rooms.length)]
      
      if (roomA !== roomB) {
        const centerAX = Math.floor(roomA.x + roomA.w / 2)
        const centerAY = Math.floor(roomA.y + roomA.h / 2)
        const centerBX = Math.floor(roomB.x + roomB.w / 2)
        const centerBY = Math.floor(roomB.y + roomB.h / 2)
        
        if (Math.random() < 0.5) {
          this.carveHorizontalCorridor(centerAX, centerBX, centerAY)
          this.carveVerticalCorridor(centerBX, centerAY, centerBY)
        } else {
          this.carveVerticalCorridor(centerAX, centerAY, centerBY)
          this.carveHorizontalCorridor(centerAX, centerBX, centerBY)
        }
      }
    }
    
    // Add borders and polish edges
    this.addBorders()
    
    // Place special features
    if (rooms.length > 0) {
      // Make the first room the starting area (well-lit, safe)
      const startRoom = rooms[0]
      for (let y = startRoom.y; y < startRoom.y + startRoom.h; y++) {
        for (let x = startRoom.x; x < startRoom.x + startRoom.w; x++) {
          if (!this.tiles[y][x].solid) {
            this.tiles[y][x].bottomTile = "grass-full"
          }
        }
      }
      
      // Make one of the last rooms special (treasure room, boss room)
      if (rooms.length > 5) {
        const specialRoom = rooms[rooms.length - 1]
        const centerX = Math.floor(specialRoom.x + specialRoom.w / 2)
        const centerY = Math.floor(specialRoom.y + specialRoom.h / 2)
        
        // Create pattern on floor
        for (let y = specialRoom.y; y < specialRoom.y + specialRoom.h; y++) {
          for (let x = specialRoom.x; x < specialRoom.x + specialRoom.w; x++) {
            if (!this.tiles[y][x].solid) {
              const dist = Math.abs(x - centerX) + Math.abs(y - centerY)
              if (dist % 2 === 0) {
                this.tiles[y][x].bottomTile = "dirt"
              } else {
                this.tiles[y][x].bottomTile = "dirt-splotchy"
              }
            }
          }
        }
      }
    }
  }
  
  private carveHorizontalCorridor(x1: number, x2: number, y: number): void {
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const width = Math.random() < 0.3 ? 2 : 1 // Sometimes make wider corridors
    
    for (let x = minX; x <= maxX; x++) {
      for (let dy = 0; dy < width; dy++) {
        if (y + dy < this.height) {
          this.tiles[y + dy][x] = {
            bottomTile: Math.random() < 0.8 ? "dirt" : "dirt-splotchy",
            solid: false,
          }
        }
      }
    }
  }
  
  private carveVerticalCorridor(x: number, y1: number, y2: number): void {
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)
    const width = Math.random() < 0.3 ? 2 : 1 // Sometimes make wider corridors
    
    for (let y = minY; y <= maxY; y++) {
      for (let dx = 0; dx < width; dx++) {
        if (x + dx < this.width) {
          this.tiles[y][x + dx] = {
            bottomTile: Math.random() < 0.8 ? "dirt" : "dirt-splotchy",
            solid: false,
          }
        }
      }
    }
  }
  
  private decorateRoom(roomX: number, roomY: number, roomWidth: number, roomHeight: number): void {
    const decorationChance = 0.05
    const rockTypes = Array.from({length: 64}, (_, i) => `rock-${i}`)
    const bushTypes = Array.from({length: 8}, (_, i) => `bush-${i}`)
    
    for (let y = roomY + 1; y < roomY + roomHeight - 1; y++) {
      for (let x = roomX + 1; x < roomX + roomWidth - 1; x++) {
        if (Math.random() < decorationChance && !this.tiles[y][x].solid) {
          // Don't place decorations in the center of large rooms
          const centerX = roomX + Math.floor(roomWidth / 2)
          const centerY = roomY + Math.floor(roomHeight / 2)
          const distFromCenter = Math.abs(x - centerX) + Math.abs(y - centerY)
          
          if (distFromCenter > 2 || roomWidth < 6 || roomHeight < 6) {
            const decorationType = Math.random()
            
            if (decorationType < 0.6) {
              // Place a rock
              this.tiles[y][x].topTile = rockTypes[Math.floor(Math.random() * rockTypes.length)]
              this.tiles[y][x].solid = true
            } else if (decorationType < 0.9) {
              // Place a bush
              this.tiles[y][x].topTile = bushTypes[Math.floor(Math.random() * bushTypes.length)]
              this.tiles[y][x].solid = true
            }
            // Leave some spots for future interactive elements
          }
        }
      }
    }
    
    // Add corner decorations in larger rooms
    if (roomWidth > 6 && roomHeight > 6) {
      const corners = [
        {x: roomX + 1, y: roomY + 1},
        {x: roomX + roomWidth - 2, y: roomY + 1},
        {x: roomX + 1, y: roomY + roomHeight - 2},
        {x: roomX + roomWidth - 2, y: roomY + roomHeight - 2}
      ]
      
      for (const corner of corners) {
        if (Math.random() < 0.4 && corner.x < this.width && corner.y < this.height) {
          this.tiles[corner.y][corner.x].topTile = rockTypes[Math.floor(Math.random() * rockTypes.length)]
          this.tiles[corner.y][corner.x].solid = true
        }
      }
    }
  }
  
  private addBorders(): void {
    // Add more interesting borders where floor meets wall
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (!this.tiles[y][x].solid) {
          // Check adjacent tiles
          const adjacent = [
            this.tiles[y-1][x].solid,
            this.tiles[y+1][x].solid,
            this.tiles[y][x-1].solid,
            this.tiles[y][x+1].solid
          ]
          
          const solidCount = adjacent.filter(s => s).length
          
          // Add transition tiles at edges
          if (solidCount === 1 || solidCount === 2) {
            if (this.tiles[y][x].bottomTile.includes("grass") && Math.random() < 0.3) {
              this.tiles[y][x].bottomTile = "grass-splotchy"
            } else if (this.tiles[y][x].bottomTile.includes("dirt") && Math.random() < 0.3) {
              this.tiles[y][x].bottomTile = "dirt-splotchy"
            }
          }
        }
      }
    }
  }

  setupTileDefinitions(tileMap: TileMap): void {
    tileMap.loadFromFile("./src/examples/crawler/assets/Land.png")
    // Define tiles based on your sprite map positions
    // These are placeholder definitions - you'll update with actual positions

    const blocks = [
      { type: "grass", x: 1, y: 57 },
      { type: "grass-splotchy", x: 7, y: 57 },
      { type: "grass-full", x: 13, y: 57 },
      { type: "dirt", x: 1, y: 63 },
      { type: "dirt-splotchy", x: 7, y: 63 },
      { type: "dirt-full", x: 13, y: 63 },
    ]

    for (const block of blocks) {
      tileMap.defineTile(`${block.type}-border-top-left`, 1 + block.x, 0 + block.y, { layer: "bottom" })
      tileMap.defineTile(`${block.type}-border-top`, 2 + block.x, 0 + block.y, { layer: "bottom" })
      tileMap.defineTile(`${block.type}-border-top-right`, 3 + block.x, 0 + block.y, { layer: "bottom" })
      tileMap.defineTile(`${block.type}`, 0 + block.x, 1 + block.y, { layer: "bottom" })
      tileMap.defineTile(`${block.type}-border-left`, 0 + block.x, 1 + block.y, { layer: "bottom" })
      tileMap.defineTile(`${block.type}-border-right`, 4 + block.x, 1 + block.y, { layer: "bottom" })
      tileMap.defineTile(`${block.type}-border-bottom-left`, 1 + block.x, 4 + block.y, { layer: "bottom" })
      tileMap.defineTile(`${block.type}-border-bottom`, 2 + block.x, 4 + block.y, { layer: "bottom" })
      tileMap.defineTile(`${block.type}-border-bottom-right`, 3 + block.x, 4 + block.y, { layer: "bottom" })
    }

    // Sprite layer tiles (entities)
    tileMap.defineTile("player", 29, 6, { layer: "sprite" })

    const rocks: { x: number; y: number; index: number }[] = []
    let index = 0
    for (let x = 0; x < 16; x++) {
      for (let y = 10; y < 14; y++) {
        rocks.push({ x: x, y: y, index: index++ })
      }
    }

    for (const rock of rocks) {
      tileMap.defineTile("rock-" + rock.index, rock.x, rock.y, { layer: "sprite", solid: true })
    }

    index = 0
    for (const grass of [1, 2, 3, 4, 5, 6, 7, 8]) {
      tileMap.defineTile("bush-" + index++, 0, grass, { layer: "sprite", solid: true })
    }
  }

  getWidth(): number {
    return this.width
  }

  getHeight(): number {
    return this.height
  }
}
