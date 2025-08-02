import Yoga, {
  FlexDirection,
  Direction,
  PositionType,
  Edge,
  Align,
  Justify,
  type Config,
} from 'yoga-layout';
import {Renderable, type RenderableOptions} from '../Renderable.ts';
import {TrackedNode, createTrackedNode} from './lib/TrackedNode.ts';
import type {ILayoutElement} from './types.ts';
import {LayoutElement} from './element.ts';

export {FlexDirection, Align, Justify, PositionType, Edge};

export enum LayoutEvents {
  LAYOUT_CHANGED = 'layout-changed',
  ELEMENT_ADDED = 'element-added',
  ELEMENT_REMOVED = 'element-removed',
  RESIZED = 'resized',
}

export class Layout extends Renderable {
  private layoutNode: TrackedNode;
  private yogaConfig: Config;
  private requestedLayoutCalculation: boolean = false;

  constructor(id: string, options: RenderableOptions & {width: number; height: number}) {
    super(id, options);

    this.yogaConfig = Yoga.Config.create();
    this.yogaConfig.setUseWebDefaults(false);
    this.yogaConfig.setPointScaleFactor(1);

    this.layoutNode = createTrackedNode({}, this.yogaConfig);
    this.layoutNode.yogaNode.setWidth(options.width);
    this.layoutNode.yogaNode.setHeight(options.height);
    this.layoutNode.yogaNode.setFlexDirection(FlexDirection.Column);

    this.calculateLayout();
  }

  public add(obj: ILayoutElement): void {
    if (!(obj instanceof LayoutElement)) {
      throw new Error(`Layout can only add LayoutElements, got ${obj.constructor.name}`);
    }

    super.add(obj);

    const childLayoutNode = obj.getLayoutNode();
    this.layoutNode.addChild(childLayoutNode);
    obj.setParentLayout(this);
    this.requestLayout();

    this.emit(LayoutEvents.ELEMENT_ADDED, obj);
  }

  public remove(id: string): void {
    const obj = this.getRenderable(id) as ILayoutElement;

    if (obj) {
      this.layoutNode.removeChild(obj.getLayoutNode());
      obj.setParentLayout(null);
      this.emit(LayoutEvents.ELEMENT_REMOVED, obj);
      this.requestLayout();
    }

    super.remove(id);
  }

  public requestLayout(): void {
    if (this.requestedLayoutCalculation) {
      return;
    }

    this.requestedLayoutCalculation = true;
    process.nextTick(() => {
      this.requestedLayoutCalculation = false;
      this.calculateLayout();
    });
  }

  public calculateLayout(): void {
    const width = this.layoutNode.yogaNode.getComputedWidth();
    const height = this.layoutNode.yogaNode.getComputedHeight();

    this.layoutNode.yogaNode.calculateLayout(width, height, Direction.LTR);

    for (const child of this.getChildren()) {
      if ('updateFromLayout' in child) {
        (child as ILayoutElement).updateFromLayout();
      }
    }

    this.emit(LayoutEvents.LAYOUT_CHANGED);
  }

  public resize(width: number, height: number): void {
    this.layoutNode.setWidth(width);
    this.layoutNode.setHeight(height);

    this.calculateLayout();
    this.emit(LayoutEvents.RESIZED, {width, height});
  }

  public getDimensions(): {width: number; height: number} {
    return {
      width: this.layoutNode.yogaNode.getComputedWidth(),
      height: this.layoutNode.yogaNode.getComputedHeight(),
    };
  }

  public getYogaConfig(): Config {
    return this.yogaConfig;
  }

  public getLayoutNode(): TrackedNode {
    return this.layoutNode;
  }

  protected destroySelf(): void {
    this.layoutNode.destroy();

    try {
      this.yogaConfig.free();
    } catch (error) {
      // Config might already be freed
    }

    super.destroySelf();
  }
}
