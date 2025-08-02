import type { Config } from "yoga-layout"
import type { Renderable } from "../Renderable.ts"
import type { TrackedNode } from "./lib/TrackedNode.ts"

export interface ILayoutElement extends Renderable {
  getLayoutNode(): TrackedNode
  setParentLayout(layout: ILayout | null): void
  updateFromLayout(): void
}

export interface ILayout {
  add(obj: ILayoutElement): void
  remove(id: string): void
  requestLayout(): void
  calculateLayout(): void
  resize(width: number, height: number): void
  getDimensions(): { width: number; height: number }
  getYogaConfig(): Config
}
