import { PerspectiveCamera, WebGLRenderer } from "three";

import { RenderResolutionController } from "./render-resolution-controller";
import type { Scene } from "three";
import { Ticker } from "./ticker";
import type { UpdateFunction } from "./ticker";

export type ViewApplicationProps = {
  rendererParentElement: HTMLElement;
  renderQualityPercentage: number;
  renderMaxPixelLimit: number;
  renderMinPixelLimit: number;
  beforeUpdate?: () => void;
  afterUpdate?: () => void;
};

export class ViewApplication {
  #renderer: WebGLRenderer;
  #resolutionController: RenderResolutionController;
  #ticker: Ticker;
  public scene?: Scene;
  public readonly camera: PerspectiveCamera;

  public constructor({
    rendererParentElement,
    renderQualityPercentage,
    renderMaxPixelLimit,
    renderMinPixelLimit,
    beforeUpdate,
    afterUpdate,
  }: ViewApplicationProps) {
    const clientWidth = window.innerWidth;
    const clientHeight = window.innerHeight;

    this.camera = new PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);

    this.#renderer = new WebGLRenderer({
      powerPreference: "high-performance",
      antialias: true,
    });

    rendererParentElement.appendChild(this.#renderer.domElement);

    this.#resolutionController = new RenderResolutionController({
      renderer: this.#renderer,
      camera: this.camera,
      size: {
        width: clientWidth,
        height: clientHeight,
      },
      quality: renderQualityPercentage,
      maxPixels: renderMaxPixelLimit,
      minPixels: renderMinPixelLimit,
    });

    this.#ticker = new Ticker({ beforeTick: beforeUpdate, afterTick: afterUpdate });

    this.#ticker.add(this.#update);
  }

  public setRenderQualityPercentage(percentage: number): void {
    this.#resolutionController.setQuality(percentage);
  }

  public addToTicker(updateFunction: UpdateFunction): void {
    this.#ticker.add(updateFunction);
  }

  public removeFromTicker(updateFunction: UpdateFunction): void {
    this.#ticker.remove(updateFunction);
  }

  public start(): void {
    this.#ticker.start();
  }

  public stop(): void {
    this.#ticker.stop();
  }

  public handleResize(width: number, height: number): void {
    this.#resolutionController.setSize(width, height);
  }

  #update = (): void => {
    if (this.scene === undefined) return;
    this.#renderer.render(this.scene, this.camera);
  };
}
