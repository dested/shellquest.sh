import type { Entity } from "./tilemap/LayeredRenderer"
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
    // Create varied grass base
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const rand = Math.random()
        let baseTile = "grass-flat"
        
        if (rand < 0.3) baseTile = "grass-long"
        else if (rand < 0.5) baseTile = "grass-flowery"
        else if (rand < 0.55) baseTile = "grass-withrocks"
        
        this.tiles[y][x] = {
          bottomTile: baseTile,
          solid: false,
        }
      }
    }

    // Add multiple dirt patches across the map
    const patches = [
      { x: 2, y: 3, width: 3, height: 3 },
      { x: 8, y: 1, width: 3, height: 3 },
      { x: 12, y: 5, width: 3, height: 3 },
      { x: 5, y: 8, width: 3, height: 3 },
      { x: 15, y: 10, width: 3, height: 3 },
      { x: 1, y: 12, width: 3, height: 3 },
      { x: 10, y: 14, width: 3, height: 3 },
    ]

    for (const patch of patches) {
      for (let py = 0; py < patch.height; py++) {
        for (let px = 0; px < patch.width; px++) {
          const x = patch.x + px
          const y = patch.y + py
          
          if (x >= this.width || y >= this.height) continue
          
          let tileName = "dirtpatch-middle"
          
          if (py === 0) {
            if (px === 0) tileName = "dirtpatch-top-left"
            else if (px === patch.width - 1) tileName = "dirtpatch-top-right"
            else tileName = "dirtpatch-top"
          } else if (py === patch.height - 1) {
            if (px === 0) tileName = "dirtpatch-bottom-left"
            else if (px === patch.width - 1) tileName = "dirtpatch-bottom-right"
            else tileName = "dirtpatch-bottom"
          } else {
            if (px === 0) tileName = "dirtpatch-middle-left"
            else if (px === patch.width - 1) tileName = "dirtpatch-middle-right"
          }
          
          this.setTile(x, y, {
            bottomTile: tileName,
            solid: false,
          })
        }
      }
    }

    // Add large trees (2-tile tall)
    const largeTrees = [
      { x: 6, y: 2, type: "green" },
      { x: 14, y: 3, type: "brown" },
      { x: 3, y: 7, type: "green" },
      { x: 18, y: 8, type: "brown" },
      { x: 11, y: 11, type: "green" },
      { x: 7, y: 15, type: "brown" },
      { x: 16, y: 14, type: "green" },
    ]

    for (const tree of largeTrees) {
      if (tree.x < this.width && tree.y < this.height - 1) {
        // Top part of tree
        this.tiles[tree.y][tree.x].topTile = `tree-${tree.type}-top`
        this.tiles[tree.y][tree.x].solid = true
        
        // Bottom part of tree
        this.tiles[tree.y + 1][tree.x].topTile = `tree-${tree.type}-bottom`
        this.tiles[tree.y + 1][tree.x].solid = true
      }
    }

    // Add small trees scattered around
    const smallTrees = [
      { x: 1, y: 1, type: "smalltree-green" },
      { x: 9, y: 4, type: "smalltree-brown" },
      { x: 4, y: 6, type: "smalltree-green" },
      { x: 13, y: 7, type: "smalltree-brown" },
      { x: 17, y: 2, type: "smalltree-green" },
      { x: 2, y: 10, type: "smalltree-brown" },
      { x: 15, y: 12, type: "smalltree-green" },
      { x: 8, y: 13, type: "smalltree-brown" },
      { x: 12, y: 1, type: "smalltree-green" },
    ]

    for (const tree of smallTrees) {
      if (tree.x < this.width && tree.y < this.height) {
        if (!this.tiles[tree.y][tree.x].topTile) {
          this.tiles[tree.y][tree.x].topTile = tree.type
          this.tiles[tree.y][tree.x].solid = true
        }
      }
    }

    // Add bushes for decoration
    const bushes = [
      { x: 5, y: 1 }, { x: 10, y: 3 }, { x: 2, y: 5 },
      { x: 16, y: 4 }, { x: 7, y: 6 }, { x: 14, y: 9 },
      { x: 3, y: 11 }, { x: 9, y: 10 }, { x: 18, y: 13 },
      { x: 6, y: 14 }, { x: 13, y: 15 }, { x: 1, y: 8 },
    ]

    for (const bush of bushes) {
      if (bush.x < this.width && bush.y < this.height) {
        if (!this.tiles[bush.y][bush.x].topTile) {
          this.tiles[bush.y][bush.x].topTile = "bush"
          this.tiles[bush.y][bush.x].solid = false
        }
      }
    }

    // Add mushrooms scattered around
    const mushrooms = [
      { x: 0, y: 2 }, { x: 4, y: 4 }, { x: 8, y: 5 },
      { x: 12, y: 3 }, { x: 15, y: 6 }, { x: 3, y: 9 },
      { x: 10, y: 8 }, { x: 17, y: 11 }, { x: 5, y: 12 },
      { x: 14, y: 13 }, { x: 2, y: 15 }, { x: 11, y: 16 },
      { x: 7, y: 10 }, { x: 16, y: 1 },
    ]

    for (const mushroom of mushrooms) {
      if (mushroom.x < this.width && mushroom.y < this.height) {
        if (!this.tiles[mushroom.y][mushroom.x].topTile) {
          this.tiles[mushroom.y][mushroom.x].topTile = "mushroom"
          this.tiles[mushroom.y][mushroom.x].solid = false
        }
      }
    }

    // Create a winding path through the level using grass-flat
    const pathTiles = [
      // Main horizontal path
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 },
      { x: 4, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 },
      { x: 8, y: 9 }, { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 },
      { x: 12, y: 9 }, { x: 13, y: 9 }, { x: 14, y: 9 }, { x: 15, y: 9 },
      { x: 16, y: 9 }, { x: 17, y: 9 }, { x: 18, y: 9 }, { x: 19, y: 9 },
      
      // Vertical connecting paths
      { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 },
      { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
      { x: 5, y: 8 }, { x: 5, y: 10 }, { x: 5, y: 11 },
      
      { x: 15, y: 0 }, { x: 15, y: 1 }, { x: 15, y: 2 }, { x: 15, y: 3 },
      { x: 15, y: 4 }, { x: 15, y: 5 }, { x: 15, y: 7 }, { x: 15, y: 8 },
      
      // Diagonal connections
      { x: 10, y: 5 }, { x: 11, y: 6 }, { x: 12, y: 7 }, { x: 13, y: 8 },
    ]

    for (const tile of pathTiles) {
      if (tile.x < this.width && tile.y < this.height) {
        this.tiles[tile.y][tile.x].bottomTile = "grass-flat"
        // Clear any decorations from the path
        if (this.tiles[tile.y][tile.x].topTile === "bush" || 
            this.tiles[tile.y][tile.x].topTile === "mushroom") {
          this.tiles[tile.y][tile.x].topTile = undefined
        }
      }
    }
  }
  
  
  
  

  setupTileDefinitions(tileMap: TileMap): void {
    tileMap.loadFromFile("tilemap_packed.png")

    tileMap.defineTile(`grass-flat`, 0, 0 , { layer: "bottom" })
    tileMap.defineTile(`grass-long`, 1, 0 , { layer: "bottom" })
    tileMap.defineTile(`grass-flowery`, 2, 0 , { layer: "bottom" })

    tileMap.defineTile(`dirtpatch-top-left`, 0, 1 , { layer: "bottom" })
    tileMap.defineTile(`dirtpatch-top`, 1, 1 , { layer: "bottom" })
    tileMap.defineTile(`dirtpatch-top-right`, 2, 1 , { layer: "bottom" })

    tileMap.defineTile(`dirtpatch-middle-left`, 0, 2 , { layer: "bottom" })
    tileMap.defineTile(`dirtpatch-middle`, 1, 2 , { layer: "bottom" })
    tileMap.defineTile(`dirtpatch-middle-right`, 2, 2 , { layer: "bottom" })

    tileMap.defineTile(`dirtpatch-bottom-left`, 0, 3 , { layer: "bottom" })
    tileMap.defineTile(`dirtpatch-bottom`, 1, 3 , { layer: "bottom" })
    tileMap.defineTile(`dirtpatch-bottom-right`, 2, 3 , { layer: "bottom" })
    
    tileMap.defineTile(`mushroom`, 5, 1 , { layer: "sprite" })
    tileMap.defineTile(`vine`, 5, 1 , { layer: "sprite" })
    tileMap.defineTile(`bush`, 5, 0 , { layer: "sprite" })

    tileMap.defineTile(`smalltree-green`, 4, 2 , { layer: "sprite" })
    tileMap.defineTile(`smalltree-brown`, 3, 2 , { layer: "sprite" })
        
    tileMap.defineTile(`tree-green-top`, 4, 0 , { layer: "top" })
    tileMap.defineTile(`tree-green-bottom`, 4, 1 , { layer: "sprite" })
    tileMap.defineTile(`tree-brown-top`, 3, 0 , { layer: "top" })
    tileMap.defineTile(`tree-brown-bottom`, 3, 1 , { layer: "sprite" })
    
    tileMap.defineTile(`grass-withrocks`, 7, 3 , { layer: "bottom" })



    // Sprite layer tiles (entities)
    tileMap.defineTile("player", 1, 18, { layer: "sprite" })
  }

  getWidth(): number {
    return this.width
  }

  getHeight(): number {
    return this.height
  }
}
