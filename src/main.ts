import "./global-styles.scss";

import type Stats from "stats-gl";
import { assetManifest } from "./asset-manifest";
import { createHtmlApp } from "./view";
import { getConfig } from "./get-config";
import { setGameScene } from "./game-state";

const appElement = document.querySelector<HTMLDivElement>("#app");

if (!appElement) {
  throw new Error("Unable to find app element");
}

const startApp = async (): Promise<void> => {
  const config = getConfig();

  let stats: Stats | undefined;

  if (config.stats) {
    const Stats = (await import("stats-gl")).default;
    stats = new Stats({
      trackGPU: true,
      trackHz: true,
      trackCPT: true,
    });

    document.body.appendChild(stats.dom);
  }

  createHtmlApp(appElement);

  const { setLoadingPercent } = await import("./game-state");
  setLoadingPercent(1);
  const { AssetLoader } = await import("./asset-loader");
  setLoadingPercent(5);
  const { UserInput, View, createPhysicsWorld, createViewApplication } = await import("./view");
  setLoadingPercent(10);

  const assetLoader = new AssetLoader();

  setLoadingPercent(12);

  const assetCache = await assetLoader.loadAssetManifest({
    assetManifest,
    onProgress: (percentage) => {
      const modifiedPercentage = ((12 + percentage) / 112) * 100;
      setLoadingPercent(modifiedPercentage);
    },
  });

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
        viewApplication.setRenderQualityPercentage(quality.percentage);
      });
  }

  const viewApplication = createViewApplication(
    appElement,
    () => {
      stats?.begin();
    },
    () => {
      stats?.end();
      stats?.update();
    }
  );

  void stats?.init(viewApplication.renderer);

  const userInput = new UserInput(appElement);

  appElement.focus();
  appElement.style.outline = "none";
  appElement.addEventListener("click", () => {
    appElement.focus();
  });

  const { world, eventQueue } = await createPhysicsWorld();

  const view = new View({
    environmentModel: assetCache.gltf.terrain.scene,
    playerModel: assetCache.gltf.player.scene,
    camera: viewApplication.camera,
    userInput,
    physicsEventQueue: eventQueue,
    physicsWorld: world,
    onReachedGoal: () => {
      console.log("reached goal 🤩");
    },
  });

  setGameScene("title");
  viewApplication.scene = view;
  viewApplication.addToTicker(view.update);
  viewApplication.start();

  if (config.physicsDebugRender) {
    const { PhysicsDebugger } = await import("./view");

    const physicsDebugRender = new PhysicsDebugger();

    view.add(physicsDebugRender);

    viewApplication.addToTicker(() => {
      physicsDebugRender.update(world);
    });
  }
};

void startApp();
