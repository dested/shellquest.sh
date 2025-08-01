import { Entity } from "./tilemap/LayeredRenderer"

export interface LevelTile {
  bottomTile: string  // Tile name for bottom layer
  solid: boolean      // Is this tile solid for collision?
  topTile?: string    // Optional overlay tile
}

export class Level {
  private tiles: LevelTile[][]
  private entities: Entity[] = []
  
  constructor(
    private width: number,
    private height: number
  ) {
    // Initialize empty level
    this.tiles = []
    for (let y = 0; y < height; y++) {
      this.tiles[y] = []
      for (let x = 0; x < width; x++) {
        this.tiles[y][x] = {
          bottomTile: 'grass',
          solid: false
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
    const tile = this.getTile(x, y)
    return tile ? tile.solid : true
  }
  
  /**
   * Get bottom layer tiles for rendering
   */
  getBottomLayerTiles(): string[][] {
    return this.tiles.map(row => row.map(tile => tile.bottomTile))
  }
  
  /**
   * Get top layer tiles for rendering
   */
  getTopLayerTiles(): Array<{tileName: string, gridX: number, gridY: number}> {
    const topTiles: Array<{tileName: string, gridX: number, gridY: number}> = []
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x].topTile) {
          topTiles.push({
            tileName: this.tiles[y][x].topTile!,
            gridX: x,
            gridY: y
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
  generateTestLevel(): void {
    // Fill with grass
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = {
          bottomTile: 'grass',
          solid: false
        }
      }
    }
    
    // Add borders
    for (let x = 0; x < this.width; x++) {
      // Top border
      this.tiles[0][x] = {
        bottomTile: 'grass_border_top',
        solid: true
      }
      // Bottom border
      this.tiles[this.height - 1][x] = {
        bottomTile: 'grass_border_bottom',
        solid: true
      }
    }
    
    for (let y = 0; y < this.height; y++) {
      // Left border
      this.tiles[y][0] = {
        bottomTile: 'grass_border_left',
        solid: true
      }
      // Right border
      this.tiles[y][this.width - 1] = {
        bottomTile: 'grass_border_right',
        solid: true
      }
    }
    
    // Corners
    this.tiles[0][0] = {
      bottomTile: 'grass_corner_tl',
      solid: true
    }
    this.tiles[0][this.width - 1] = {
      bottomTile: 'grass_corner_tr',
      solid: true
    }
    this.tiles[this.height - 1][0] = {
      bottomTile: 'grass_corner_bl',
      solid: true
    }
    this.tiles[this.height - 1][this.width - 1] = {
      bottomTile: 'grass_corner_br',
      solid: true
    }
    
    // Add some dirt patches
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1
      const y = Math.floor(Math.random() * (this.height - 2)) + 1
      this.tiles[y][x] = {
        bottomTile: 'dirt',
        solid: false
      }
    }
    
    // Add some rocks (entities)
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1
      const y = Math.floor(Math.random() * (this.height - 2)) + 1
      
      this.addEntity({
        gridX: x,
        gridY: y,
        width: 1,
        height: 1,
        tileName: 'rock',
        layer: 'sprite'
      })
      
      // Make the tile solid
      this.tiles[y][x].solid = true
    }
    
    // Add some bushes (entities)
    for (let i = 0; i < 15; i++) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1
      const y = Math.floor(Math.random() * (this.height - 2)) + 1
      
      if (!this.tiles[y][x].solid) {
        this.addEntity({
          gridX: x,
          gridY: y,
          width: 1,
          height: 1,
          tileName: 'bush',
          layer: 'sprite'
        })
      }
    }
  }
  
  getWidth(): number {
    return this.width
  }
  
  getHeight(): number {
    return this.height
  }
}