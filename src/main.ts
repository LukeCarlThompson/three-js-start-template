import "./style.css";

import { UserInput, View, createPhysicsWorld, createViewApplication } from "./view";

import { AssetLoader } from "./asset-loader";
import type Stats from "stats-gl";
import { assetManifest } from "./asset-manifest";
import { getConfig } from "./get-config";

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

    appElement.appendChild(stats.dom);
  }

  const assetLoader = new AssetLoader();

  const assetCache = await assetLoader.loadAssetManifest({
    assetManifest,
    onProgress: (percentage) => {
      console.log("assets loaded percentage -->", percentage);
    },
  });

  if (config.debugControls) {
    const { Pane } = await import("tweakpane");
    const tweakpane = new Pane();

    tweakpane.element.style.position = "absolute";
    tweakpane.element.style.top = "10px";
    tweakpane.element.style.right = "10px";
    tweakpane.element.style.zIndex = "2";

    appElement.appendChild(tweakpane.element);

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

  const { world, eventQueue } = await createPhysicsWorld();

  const view = new View({
    environmentModel: assetCache.gltf.scene.scene,
    camera: viewApplication.camera,
    userInput,
    physicsEventQueue: eventQueue,
    physicsWorld: world,
  });

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
