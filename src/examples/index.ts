#!/usr/bin/env bun

import {
  CliRenderer,
  createCliRenderer,
  TextRenderable,
  FrameBufferRenderable,
  RGBA,
  SelectElement,
  SelectElementEvents,
  type SelectOption,
  type ParsedKey,
} from "../index"
import { renderFontToFrameBuffer, measureText } from "../ui/ascii.font"
import { getKeyHandler } from "../ui/lib/KeyHandler"

import * as crawlerExample from "./crawler"
interface Example {
  name: string
  description: string
  run?: (renderer: CliRenderer) => void
  destroy?: (renderer: CliRenderer) => void
}

const examples: Example[] = [
  {
    name: "Dungeon Crawler",
    description: "Explore a procedural cave with WASD/arrow controls",
    run: crawlerExample.run,
    destroy: crawlerExample.destroy,
  },
]

class ExampleSelector {
  private renderer: CliRenderer
  private currentExample: Example | null = null
  private inMenu = true

  private title: FrameBufferRenderable | null = null
  private instructions: TextRenderable | null = null
  private selectElement: SelectElement | null = null
  private notImplementedText: TextRenderable | null = null

  constructor(renderer: CliRenderer) {
    this.renderer = renderer
    this.createStaticElements()
    this.createSelectElement()
    this.setupKeyboardHandling()
    this.renderer.renderOnce()

    this.renderer.on("resize", (width: number, height: number) => {
      this.handleResize(width, height)
    })
  }

  private createTitle(width: number, height: number): void {
    const titleText = "OPENTUI EXAMPLES"
    const titleFont = "tiny"
    const { width: titleWidth, height: titleHeight } = measureText({ text: titleText, font: titleFont })
    const centerX = Math.floor(width / 2) - Math.floor(titleWidth / 2)

    this.title = this.renderer.createFrameBuffer("title", {
      width: titleWidth,
      height: titleHeight,
      x: centerX,
      y: 1,
      zIndex: 10,
    })
    this.title.frameBuffer.clear(RGBA.fromInts(0, 17, 34, 0))

    renderFontToFrameBuffer(this.title.frameBuffer, {
      text: titleText,
      x: 0,
      y: 0,
      fg: RGBA.fromInts(255, 255, 255, 255),
      bg: RGBA.fromInts(0, 17, 34, 255),
      font: titleFont,
    })
  }

  private createStaticElements(): void {
    const width = this.renderer.terminalWidth
    const height = this.renderer.terminalHeight

    this.createTitle(width, height)

    this.instructions = new TextRenderable("instructions", {
      x: 2,
      y: 4,
      content:
        "Use ↑↓ or j/k to navigate, Shift+↑↓ or Shift+j/k for fast scroll, Enter to run, Escape to return, ` for console, ctrl+c to quit",
      fg: "#AAAAAA",
      zIndex: 10,
    })
    this.renderer.add(this.instructions)
  }

  private createSelectElement(): void {
    const width = this.renderer.terminalWidth
    const height = this.renderer.terminalHeight

    const selectOptions: SelectOption[] = examples.map((example) => ({
      name: example.name,
      description: example.description,
      value: example,
    }))

    this.selectElement = new SelectElement("example-selector", {
      x: 1,
      y: 6,
      width: width - 2,
      height: height - 8,
      zIndex: 5,
      options: selectOptions,
      backgroundColor: "#001122",
      selectedBackgroundColor: "#334455",
      textColor: "#FFFFFF",
      selectedTextColor: "#FFFF00",
      descriptionColor: "#888888",
      selectedDescriptionColor: "#CCCCCC",
      showScrollIndicator: true,
      wrapSelection: true,
      showDescription: true,
      fastScrollStep: 5, // Shift+K/J or Shift+Up/Down moves 5 items at once
      borderStyle: "single",
      borderColor: "#FFFFFF",
      focusedBorderColor: "#00AAFF",
      title: "Examples",
      titleAlignment: "center",
    })

    this.selectElement.on(SelectElementEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
      this.runSelected(option.value as Example)
    })

    this.renderer.add(this.selectElement)
    this.selectElement.focus()
  }

  private handleResize(width: number, height: number): void {
    if (this.title) {
      const titleWidth = this.title.frameBuffer.getWidth()
      const centerX = Math.floor(width / 2) - Math.floor(titleWidth / 2)
      this.title.x = centerX
    }

    if (this.selectElement) {
      this.selectElement.setWidth(width - 2)
      this.selectElement.setHeight(height - 8)
    }

    this.renderer.renderOnce()
  }

  private setupKeyboardHandling(): void {
    getKeyHandler().on("keypress", (key: ParsedKey) => {
      if (!this.inMenu) {
        switch (key.name) {
          case "escape":
            this.returnToMenu()
            break
        }
      }

      switch (key.raw) {
        case "\u0003":
          this.cleanup()
          process.exit(0)
          break
        case "`":
          this.renderer.console.toggle()
          break
        case "t":
          this.renderer.toggleDebugOverlay()
          break
      }
    })
  }

  private runSelected(selected: Example): void {
    this.inMenu = false
    this.hideMenuElements()

    if (selected.run) {
      this.currentExample = selected
      selected.run(this.renderer)
    } else {
      if (!this.notImplementedText) {
        this.notImplementedText = new TextRenderable("not-implemented", {
          x: 10,
          y: 10,
          content: `${selected.name} not yet implemented. Press Escape to return.`,
          fg: "#FFFF00",
          zIndex: 10,
        })
        this.renderer.add(this.notImplementedText)
      }
      this.renderer.renderOnce()
    }
  }

  private hideMenuElements(): void {
    if (this.title) this.title.visible = false
    if (this.instructions) this.instructions.visible = false
    if (this.selectElement) {
      this.selectElement.visible = false
      this.selectElement.blur()
    }
  }

  private showMenuElements(): void {
    if (this.title) this.title.visible = true
    if (this.instructions) this.instructions.visible = true
    if (this.selectElement) {
      this.selectElement.visible = true
      this.selectElement.focus()
    }
  }

  private returnToMenu(): void {
    if (this.currentExample) {
      this.currentExample.destroy?.(this.renderer)
      this.currentExample = null
    }

    if (this.notImplementedText) {
      this.renderer.remove(this.notImplementedText.id)
      this.notImplementedText = null
    }

    this.inMenu = true
    this.restart()
  }

  private restart(): void {
    this.renderer.pause()
    this.showMenuElements()
    this.renderer.setBackgroundColor("#001122")
    this.renderer.renderOnce()
  }

  private cleanup(): void {
    if (this.currentExample) {
      this.currentExample.destroy?.(this.renderer)
    }
    if (this.selectElement) {
      this.selectElement.blur()
    }
    this.renderer.stop()
  }
}

const renderer = await createCliRenderer({
  exitOnCtrlC: false,
  targetFps: 60,
})

renderer.setBackgroundColor("#001122")
new ExampleSelector(renderer)
