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

  createSvelteApp(appElement);
  const { clientWidth, clientHeight } = appElement;
  const config = getConfig();

  const { gameState } = await import("./game-state.svelte.ts");
  gameState.setLoadingPercent(1);
  const { AssetLoader } = await import("./asset-loader");
  gameState.setLoadingPercent(5);
  const { UserInput, View, createPhysicsWorld, createRenderer, Ticker, RenderResolutionController } = await import(
    "./view"
  );
  const { PerspectiveCamera } = await import("three");
  gameState.setLoadingPercent(10);

  const assetLoader = new AssetLoader();

  gameState.setLoadingPercent(12);

  // The asset manifest should be broken up into ones specific for each view and ones that are used in all views.
  const assetCache = await assetLoader.loadAssetManifest({
    assetManifest,
    onProgress: (percentage) => {
      const modifiedPercentage = ((12 + percentage) / 112) * 100;
      gameState.setLoadingPercent(modifiedPercentage);
    },
  });

  const renderer = createRenderer();
  appElement.appendChild(renderer.domElement);

  const renderResolutionController = new RenderResolutionController({
    maxPixels: 1920 * 1080,
    minPixels: 400 * 600,
    quality: gameState.state.renderQuality,
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
      gameState.setGameScene("level-complete");
    },
  });

  gameState.setGameScene("title");

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
    renderer.render(view, camera);
  });

  const handleResize = () => {
    const { clientWidth, clientHeight } = appElement;
    renderResolutionController.size.width = clientWidth;
    renderResolutionController.size.height = clientHeight;
    renderResolutionController.applySizeAndQuality(renderer, camera);
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

    const quality = {
      percentage: 100,
    };

    resolutionFolder
      .addBinding(quality, "percentage", {
        min: 0,
        max: 100,
      })
      .on("change", () => {
        gameState.state.renderQuality = quality.percentage;
        renderResolutionController.quality = gameState.state.renderQuality;
        renderResolutionController.applySizeAndQuality(renderer, camera);
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
