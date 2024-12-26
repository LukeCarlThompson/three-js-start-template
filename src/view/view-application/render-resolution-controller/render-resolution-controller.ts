import { OrthographicCamera, PerspectiveCamera, type WebGLRenderer } from "three";

type RenderResolutionControllerProps = {
  renderer: WebGLRenderer;
  camera: PerspectiveCamera | OrthographicCamera;
  size: {
    height: number;
    width: number;
  };
  quality: number;
  maxPixels: number;
  minPixels: number;
};

export class RenderResolutionController {
  private readonly size: {
    height: number;
    width: number;
  };
  private quality: number;
  private readonly maxPixels: number;
  private readonly minPixels: number;
  private readonly renderer: WebGLRenderer;
  private readonly camera: PerspectiveCamera | OrthographicCamera;
  private readonly resolution = {
    width: 0,
    height: 0,
  };

  public constructor({ renderer, camera, size, quality, maxPixels, minPixels }: RenderResolutionControllerProps) {
    this.size = size;
    this.quality = quality;
    this.maxPixels = maxPixels;
    this.minPixels = minPixels;
    this.renderer = renderer;
    this.camera = camera;

    this.#setSizeAndPixelDensity();
  }

  public readonly getSize = (): { width: number; height: number } => this.size;

  public readonly getResolution = (): { width: number; height: number } => this.resolution;

  public readonly setSize = (height: number, width: number): void => {
    this.size.height = height;
    this.size.width = width;
    this.#setSizeAndPixelDensity();
  };

  public readonly setQuality = (quality: number): void => {
    this.quality = quality;
    this.#setSizeAndPixelDensity();
  };

  #setSizeAndPixelDensity() {
    const { width, height } = this.size;

    this.renderer.setSize(width, height);

    const pixelRatio = this.#calculatePixelRatio(width * height, this.quality);

    this.renderer.setPixelRatio(pixelRatio);

    this.resolution.width = width * pixelRatio;
    this.resolution.height = height * pixelRatio;

    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = width / height;
    }
    if (this.camera instanceof OrthographicCamera) {
      this.camera.left = width * -0.05;
      this.camera.right = width * 0.05;
      this.camera.bottom = height * -0.05;
      this.camera.top = height * 0.05;
    }
    this.camera.updateProjectionMatrix();
  }

  #calculatePixelRatio(screenPixels: number, qualitySetting: number) {
    const maxPixelRatio = Math.min(this.maxPixels / screenPixels, 2);
    const minPixelRatio = Math.min(this.minPixels / screenPixels, 0.5);

    const result = (qualitySetting / 100) * (maxPixelRatio - minPixelRatio) + minPixelRatio;

    return result;
  }
}
