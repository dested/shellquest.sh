# Tile Mappings Required for Dungeon Generator

The tiles are defined in `setupTileDefinitions()` in Level.ts:508. 
Each tile needs to be mapped to coordinates (x, y) in your tilemap_packed.png file.

## Floor Tiles (Bottom Layer)
- `void` - Empty space background (10, 10)
- `floor-stone` - Basic stone floor (1, 0)
- `floor-stone-cracked` - Damaged floor (2, 0)
- `floor-stone-moss` - Mossy floor (3, 0)
- `floor-stone-dark` - Dark stone floor (4, 0)
- `floor-stone-fancy` - Decorative floor for treasure rooms (0, 1)

## Wall Tiles (Bottom Layer - Autotiled)
The system automatically picks the right wall tile based on neighbors:
- `wall-block` - Solid wall block (0, 3)
- `wall-isolated` - Single wall piece (1, 3)
- `wall-vertical` - Vertical wall segment (2, 3)
- `wall-horizontal` - Horizontal wall segment (3, 3)
- `wall-corner-nw` - Northwest corner (0, 4)
- `wall-corner-ne` - Northeast corner (1, 4)
- `wall-corner-sw` - Southwest corner (2, 4)
- `wall-corner-se` - Southeast corner (3, 4)
- `wall-t-north` - T-junction facing north (4, 3)
- `wall-t-south` - T-junction facing south (5, 3)
- `wall-t-west` - T-junction facing west (6, 3)
- `wall-t-east` - T-junction facing east (7, 3)
- `wall-cross` - Four-way junction (4, 4)
- `wall-cross-nw` - Cross missing northwest (5, 4)
- `wall-cross-ne` - Cross missing northeast (6, 4)
- `wall-cross-sw` - Cross missing southwest (7, 4)
- `wall-cross-se` - Cross missing southeast (8, 4)

## Shadow Tiles (Sprite Layer)
Adds depth to the dungeon:
- `shadow-north` - Shadow below walls (0, 2)
- `shadow-north-west` - Corner shadow left (1, 2)
- `shadow-north-east` - Corner shadow right (2, 2)
- `shadow-north-full` - Full shadow span (3, 2)
- `shadow-west` - Side shadow (4, 2)

## Interactive Objects (Sprite Layer)
- `door-closed` - Closed door (5, 1)
- `door-open` - Open door (6, 1)
- `stairs-up` - Stairs going up/entrance (7, 1)
- `stairs-down` - Stairs going down/exit (8, 1)

## Containers (Sprite Layer)
- `chest-closed` - Treasure chest closed (9, 0)
- `chest-open` - Treasure chest open (10, 0)
- `barrel` - Storage barrel (11, 0)
- `crate` - Wooden crate (12, 0)
- `pot` - Clay pot (13, 0)

## Decorations (Sprite Layer)
- `torch-wall` - Wall-mounted torch (5, 2)
- `brazier-lit` - Lit brazier for boss rooms (6, 2)
- `banner-red` - Red wall banner (7, 2)
- `banner-blue` - Blue wall banner (8, 2)

## Debris (Sprite Layer)
- `bones` - Scattered bones (9, 1)
- `skull` - Skull decoration (10, 1)
- `rubble` - Stone rubble (11, 1)
- `web` - Spider web (12, 1)

## Treasure (Sprite Layer)
- `coins` - Gold coins (9, 2)
- `gem-red` - Red gem (10, 2)
- `gem-blue` - Blue gem (11, 2)

## Large Decorations (Sprite Layer)
- `pillar` - Stone pillar (14, 0)
- `statue` - Stone statue (15, 0)

## Characters (Sprite Layer)
- `player` - Player character (1, 18)

## How the Generator Works

1. **Base Generation**: Uses ROT.js Digger algorithm to create rooms and corridors
2. **Room Types**: 
   - Spawn room (first room with stairs up)
   - Boss room (last room with stairs down and braziers)
   - Treasure rooms (15% chance, contain chests and gems)
   - Normal rooms (standard decorations)

3. **Autotiling**: Walls automatically pick the correct sprite based on neighboring walls
4. **Shadows**: Added below walls for depth
5. **Decorations**: 
   - Near walls: torches, banners
   - Floor: barrels, crates, bones, webs
   - Special rooms get unique decorations

6. **Floor Variations**: Different room types use different floor tiles for visual variety

The 100x100 dungeon will generate with varied, interesting layouts each time you click "Generate Dungeon"!