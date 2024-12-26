import { AudioLoader, LoadingManager, NearestFilter, RepeatWrapping, SRGBColorSpace, TextureLoader } from "three";

import type { AssetCache } from "./asset-cache";
import type { AssetManifest } from "./asset-manifest";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type LoadAssetManifestProps = {
  assetManifest: AssetManifest;
  onProgress?: (percentageLoaded: number) => void;
};

export class AssetLoader {
  readonly #textureLoader: TextureLoader;
  readonly #gltfLoader: GLTFLoader;
  readonly #dracoLoader: DRACOLoader;
  readonly #audioLoader: AudioLoader;
  readonly #loadingManager: LoadingManager;
  public readonly promises: Promise<unknown>[] = [];

  public constructor() {
    this.#loadingManager = new LoadingManager();
    this.#textureLoader = new TextureLoader(this.#loadingManager);
    this.#audioLoader = new AudioLoader(this.#loadingManager);
    this.#gltfLoader = new GLTFLoader(this.#loadingManager);
    this.#dracoLoader = new DRACOLoader(this.#loadingManager);
    this.#dracoLoader.setDecoderPath("./draco/");
    this.#gltfLoader.setDRACOLoader(this.#dracoLoader);
  }

  public readonly loadAssetManifest = async ({
    assetManifest,
    onProgress = () => undefined,
  }: LoadAssetManifestProps): Promise<AssetCache<typeof assetManifest>> => {
    this.#loadingManager.onProgress = (_url: string, loaded: number, total: number) => {
      onProgress((total / loaded) * 100);
    };

    const { texture, audio, gltf } = assetManifest;

    const assetCache: AssetCache<typeof assetManifest> = {
      texture: {},
      audio: {},
      gltf: {},
    };

    texture.forEach(({ name, url }) => {
      const asyncFunction = async ({ name, url }: { name: string; url: string }) => {
        const texture = await this.#textureLoader.loadAsync(url);
        texture.colorSpace = SRGBColorSpace;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.magFilter = NearestFilter;
        texture.flipY = false;
        assetCache.texture[name] = texture;
      };

      this.promises.push(asyncFunction({ name, url }));
    });

    audio.forEach(({ name, url }) => {
      const asyncFunction = async ({ name, url }: { name: string; url: string }) => {
        const asset = await this.#audioLoader.loadAsync(url);
        assetCache.audio[name] = asset;
      };

      this.promises.push(asyncFunction({ name, url }));
    });

    gltf.forEach(({ name, url }) => {
      const asyncFunction = async ({ name, url }: { name: string; url: string }) => {
        const asset = await this.#gltfLoader.loadAsync(url);

        assetCache.gltf[name] = asset;
      };

      this.promises.push(asyncFunction({ name, url }));
    });

    await Promise.all(this.promises);

    return assetCache;
  };
}
