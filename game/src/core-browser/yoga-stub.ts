// Stub for yoga-layout in browser - not needed for our browser renderer

// Enums
export enum FlexDirection {
  Column = 0,
  ColumnReverse = 1,
  Row = 2,
  RowReverse = 3,
}

export enum Direction {
  Inherit = 0,
  LTR = 1,
  RTL = 2,
}

export enum PositionType {
  Static = 0,
  Relative = 1,
  Absolute = 2,
}

export enum Edge {
  Left = 0,
  Top = 1,
  Right = 2,
  Bottom = 3,
  Start = 4,
  End = 5,
  Horizontal = 6,
  Vertical = 7,
  All = 8,
}

export enum Align {
  Auto = 0,
  FlexStart = 1,
  Center = 2,
  FlexEnd = 3,
  Stretch = 4,
  Baseline = 5,
  SpaceBetween = 6,
  SpaceAround = 7,
}

export enum Justify {
  FlexStart = 0,
  Center = 1,
  FlexEnd = 2,
  SpaceBetween = 3,
  SpaceAround = 4,
  SpaceEvenly = 5,
}

// Types
export interface Config {
  create(): Node
  destroy(node: Node): void
}

export interface Node {
  setPositionType(type: PositionType): void
  setPosition(edge: Edge, value: number): void
  setWidth(width: number | string): void
  setHeight(height: number | string): void
  setFlex(flex: number): void
  setFlexGrow(flexGrow: number): void
  setFlexShrink(flexShrink: number): void
  setFlexBasis(flexBasis: number | string): void
  setFlexDirection(direction: FlexDirection): void
  setJustifyContent(justify: Justify): void
  setAlignContent(align: Align): void
  setAlignItems(align: Align): void
  setAlignSelf(align: Align): void
  setMargin(edge: Edge, value: number): void
  setPadding(edge: Edge, value: number): void
  setBorder(edge: Edge, value: number): void
  setGap(gap: number): void
  setDisplay(display: number): void
  insertChild(child: Node, index: number): void
  removeChild(child: Node): void
  getChildCount(): number
  getChild(index: number): Node | null
  getParent(): Node | null
  calculateLayout(width?: number, height?: number, direction?: Direction): void
  getComputedLayout(): {
    left: number
    top: number
    width: number
    height: number
  }
  getComputedWidth(): number
  getComputedHeight(): number
  getComputedLeft(): number
  getComputedTop(): number
  getComputedRight(): number
  getComputedBottom(): number
  getComputedMargin(edge: Edge): number
  getComputedPadding(edge: Edge): number
  getComputedBorder(edge: Edge): number
  markDirty(): void
  unsetMeasureFunc(): void
  setMeasureFunc(fn: Function): void
  free(): void
}

// Stub implementation
class StubNode implements Node {
  private children: Node[] = []
  private parent: Node | null = null
  private layout = { left: 0, top: 0, width: 0, height: 0 }

  setPositionType(type: PositionType): void {}
  setPosition(edge: Edge, value: number): void {}
  setWidth(width: number | string): void {
    if (typeof width === 'number') this.layout.width = width
  }
  setHeight(height: number | string): void {
    if (typeof height === 'number') this.layout.height = height
  }
  setFlex(flex: number): void {}
  setFlexGrow(flexGrow: number): void {}
  setFlexShrink(flexShrink: number): void {}
  setFlexBasis(flexBasis: number | string): void {}
  setFlexDirection(direction: FlexDirection): void {}
  setJustifyContent(justify: Justify): void {}
  setAlignContent(align: Align): void {}
  setAlignItems(align: Align): void {}
  setAlignSelf(align: Align): void {}
  setMargin(edge: Edge, value: number): void {}
  setPadding(edge: Edge, value: number): void {}
  setBorder(edge: Edge, value: number): void {}
  setGap(gap: number): void {}
  setDisplay(display: number): void {}
  
  insertChild(child: Node, index: number): void {
    this.children.splice(index, 0, child)
    ;(child as StubNode).parent = this
  }
  
  removeChild(child: Node): void {
    const index = this.children.indexOf(child)
    if (index !== -1) {
      this.children.splice(index, 1)
      ;(child as StubNode).parent = null
    }
  }
  
  getChildCount(): number { return this.children.length }
  getChild(index: number): Node | null { return this.children[index] || null }
  getParent(): Node | null { return this.parent }
  
  calculateLayout(width?: number, height?: number, direction?: Direction): void {
    if (width !== undefined) this.layout.width = width
    if (height !== undefined) this.layout.height = height
  }
  
  getComputedLayout() { return this.layout }
  getComputedWidth(): number { return this.layout.width }
  getComputedHeight(): number { return this.layout.height }
  getComputedLeft(): number { return this.layout.left }
  getComputedTop(): number { return this.layout.top }
  getComputedRight(): number { return this.layout.left + this.layout.width }
  getComputedBottom(): number { return this.layout.top + this.layout.height }
  getComputedMargin(edge: Edge): number { return 0 }
  getComputedPadding(edge: Edge): number { return 0 }
  getComputedBorder(edge: Edge): number { return 0 }
  
  markDirty(): void {}
  unsetMeasureFunc(): void {}
  setMeasureFunc(fn: Function): void {}
  free(): void {}
}

class StubConfig implements Config {
  create(): Node {
    return new StubNode()
  }
  destroy(node: Node): void {}
}

// Default export
const Yoga = {
  Config: {
    create(): Config {
      return new StubConfig()
    }
  },
  Node: {
    create(config?: Config): Node {
      return new StubNode()
    }
  }
}

export default Yoga
export type { Node as YogaNode }