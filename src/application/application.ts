import type { EventQueue, World } from "@dimforge/rapier3d-compat";
import type { GameLevelName, GameState } from "../game-state.svelte";
import type { PhysicsDebugger, Player } from "../view";

import type { AssetLoader } from "../asset-loader";
import { GameLevel } from "../view";
import { PerspectiveCamera } from "three";
import { RenderResolutionController } from "./render-resolution-controller";
import type Stats from "stats-gl";
import { Ticker } from "./ticker";
import { UserInput } from "./user-input";
import type { WebGLRenderer } from "three";
import type { WebGPURenderer } from "three/webgpu";
import { assetManifest } from "../asset-manifest";

export type ApplicationProps = {
  renderer: WebGLRenderer | WebGPURenderer;
  world: World;
  eventQueue: EventQueue;
  appElement: HTMLElement;
  player: Player;
  assetLoader: AssetLoader;
  gameState: GameState;
  physicsDebugger?: PhysicsDebugger;
  stats?: Stats;
};

export class Application {
  #renderer: WebGLRenderer | WebGPURenderer;
  #ticker: Ticker;
  #camera: PerspectiveCamera;
  #physicsWorld: World;
  #eventQueue: EventQueue;
  #userInput: UserInput;
  #renderResolutionController: RenderResolutionController;
  #assetLoader: AssetLoader;
  #currentLevel?: GameLevel;
  #player: Player;
  #gameState: GameState;
  #appElement: HTMLElement;
  #physicsDebugger?: PhysicsDebugger;

  public constructor({
    renderer,
    world,
    eventQueue,
    appElement,
    player,
    assetLoader,
    gameState,
    physicsDebugger,
    stats,
  }: ApplicationProps) {
    this.#gameState = gameState;
    this.#renderer = renderer;
    this.#physicsWorld = world;
    this.#eventQueue = eventQueue;
    this.#physicsDebugger = physicsDebugger;
    this.#appElement = appElement;
    this.#appElement.appendChild(this.#renderer.domElement);
    appElement.focus();
    appElement.style.outline = "none";
    appElement.addEventListener("click", () => {
      appElement.focus();
    });
    const { clientWidth, clientHeight } = appElement;
    this.#camera = new PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 1000);
    this.#userInput = new UserInput(appElement);
    this.#renderResolutionController = new RenderResolutionController({
      maxPixels: 1920 * 1080,
      minPixels: 400 * 600,
      quality: this.#gameState.renderQuality,
      size: { width: clientWidth, height: clientHeight },
    });
    this.#assetLoader = assetLoader;
    this.#player = player;
    this.#ticker = new Ticker();
    this.#ticker.add(this.#update);
    this.#ticker.start();

    this.#userInput.addEventListener("jump-pressed", () => this.#currentLevel?.jumpPressed());

    if (stats) {
      this.#ticker.beforeTick = () => {
        stats.begin();
      };

      this.#ticker.afterTick = () => {
        stats.end();
        stats.update();
      };
    }
  }

  public readonly handleResize = (): void => {
    const { clientWidth, clientHeight } = this.#appElement;
    this.#renderResolutionController.size.width = clientWidth;
    this.#renderResolutionController.size.height = clientHeight;
    this.#renderResolutionController.applyTo(this.#renderer, this.#camera);
  };

  public readonly restartCurrentLevel = (): void => {
    this.#currentLevel?.reset();
  };

  public readonly switchLevel = async ({
    levelName,
    onLoadingProgressChanged,
  }: {
    levelName: GameLevelName;
    onLoadingProgressChanged: (progress: number) => void;
  }): Promise<void> => {
    const assetCache = await this.#assetLoader.loadAssetManifest({
      assetManifest: assetManifest[levelName],
      onProgress: onLoadingProgressChanged,
    });

    this.#currentLevel?.destroy();

    this.#currentLevel = new GameLevel({
      environmentModel: assetCache.gltf[levelName].scene,
      player: this.#player,
      camera: this.#camera,
      physicsEventQueue: this.#eventQueue,
      physicsWorld: this.#physicsWorld,
      onReachedGoal: () => {
        this.#gameState.currentScene = "level-complete";
      },
      onPlayerDie: () => {
        this.#gameState.currentScene = "game-over";
      },
    });

    this.handleResize();

    this.#currentLevel.reset();

    this.#currentLevel.setShadowMapQuality(this.#gameState.renderQuality);

    if (this.#physicsDebugger) {
      this.#currentLevel.add(this.#physicsDebugger);
    }
  };

  public setRenderQuality = (quality: number): void => {
    this.#gameState.renderQuality = quality;
    this.#renderResolutionController.quality = this.#gameState.renderQuality;
    if (this.#currentLevel) {
      this.#currentLevel.setShadowMapQuality(this.#gameState.renderQuality);
    }
    this.#renderResolutionController.applyTo(this.#renderer, this.#camera);
  };

  #update = (delta: number): void => {
    if (!this.#currentLevel) return;

    this.#currentLevel.playerMovement.left = this.#userInput.state.left;
    this.#currentLevel.playerMovement.right = this.#userInput.state.right;
    this.#currentLevel.playerMovement.up = this.#userInput.state.up;
    this.#currentLevel.update(delta);
    this.#physicsDebugger?.update(this.#physicsWorld);

    if ("renderAsync" in this.#renderer) {
      void this.#renderer.renderAsync(this.#currentLevel, this.#camera);
    } else {
      this.#renderer.render(this.#currentLevel, this.#camera);
    }
  };
}
