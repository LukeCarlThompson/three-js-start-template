import "./global-styles.scss";

import type Stats from "stats-gl";
import { assetManifest } from "./asset-manifest";
import { createSvelteApp } from "./view";
import { getConfig } from "./get-config";

const startApp = async (): Promise<void> => {
  const appElement = document.querySelector<HTMLDivElement>("#app");

  if (!appElement) {
    throw new Error("Unable to find app element");
  }

  // TODO: Load the loading screen before the other components
  createSvelteApp(appElement);
  const { clientWidth, clientHeight } = appElement;
  const config = getConfig();

  const { gameState } = await import("./game-state.svelte.ts");
  gameState.loadingPercent = 1;
  const { AssetLoader } = await import("./asset-loader");
  gameState.loadingPercent = 5;
  const { UserInput, View, createPhysicsWorld, createRenderer, Ticker, RenderResolutionController } = await import(
    "./view"
  );
  const { PerspectiveCamera } = await import("three");
  gameState.loadingPercent = 10;
  const assetLoader = new AssetLoader();
  gameState.loadingPercent = 12;

  // The asset manifest should be broken up into ones specific for each view and ones that are used in all views.
  const assetCache = await assetLoader.loadAssetManifest({
    assetManifest,
    onProgress: (percentage) => {
      const modifiedPercentage = ((12 + percentage) / 112) * 100;
      gameState.loadingPercent = modifiedPercentage;
    },
  });

  const renderer = await createRenderer();
  appElement.appendChild(renderer.domElement);

  const renderResolutionController = new RenderResolutionController({
    maxPixels: 1920 * 1080,
    minPixels: 400 * 600,
    quality: gameState.renderQuality,
    size: { width: clientWidth, height: clientHeight },
  });

  const userInput = new UserInput(appElement);

  appElement.focus();
  appElement.style.outline = "none";
  appElement.addEventListener("click", () => {
    appElement.focus();
  });

  const { world, eventQueue } = await createPhysicsWorld();

  const camera = new PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);

  // TODO: Write function to load and unload new Views.
  const view = new View({
    environmentModel: assetCache.gltf.terrain.scene,
    playerModel: assetCache.gltf.player.scene,
    camera: camera,
    userInput,
    physicsEventQueue: eventQueue,
    physicsWorld: world,
    onReachedGoal: () => {
      gameState.currentScene = "level-complete";
    },
  });

  gameState.currentScene = "title";

  let stats: Stats | undefined;
  const ticker = new Ticker({
    beforeTick: () => {
      stats?.begin();
    },
    afterTick: () => {
      stats?.end();
      stats?.update();
    },
  });

  ticker.add(view.update);
  ticker.start();
  ticker.add(() => {
    if ("renderAsync" in renderer) {
      void renderer.renderAsync(view, camera);
    } else {
      renderer.render(view, camera);
    }
  });

  const handleResize = () => {
    const { clientWidth, clientHeight } = appElement;
    renderResolutionController.size.width = clientWidth;
    renderResolutionController.size.height = clientHeight;
    renderResolutionController.applyTo(renderer, camera);
  };
  window.addEventListener("resize", handleResize);
  handleResize();

  if (config.stats) {
    const Stats = (await import("stats-gl")).default;
    stats = new Stats({
      trackGPU: true,
      trackHz: true,
      trackCPT: true,
    });

    void stats.init(renderer);

    document.body.appendChild(stats.dom);
  }

  if (config.debugControls) {
    const { Pane } = await import("tweakpane");
    const tweakpane = new Pane();

    tweakpane.element.style.position = "absolute";
    tweakpane.element.style.top = "10px";
    tweakpane.element.style.right = "10px";
    tweakpane.element.style.zIndex = "2";

    document.body.appendChild(tweakpane.element);

    // Render resolution controls
    const resolutionFolder = tweakpane.addFolder({
      title: "Resolution",
    });

    resolutionFolder
      .addBinding(gameState, "renderQuality", {
        min: 0,
        max: 100,
      })
      .on("change", () => {
        renderResolutionController.quality = gameState.renderQuality;
        renderResolutionController.applyTo(renderer, camera);
      });
  }

  if (config.physicsDebugRender) {
    const { PhysicsDebugger } = await import("./view");

    const physicsDebugRender = new PhysicsDebugger();

    view.add(physicsDebugRender);

    ticker.add(() => {
      physicsDebugRender.update(world);
    });
  }
};

void startApp();
