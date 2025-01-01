import "./global-styles.scss";

import { createSvelteApp } from "./view";
import { gameState } from "./game-state.svelte.ts";
import { getConfig } from "./get-config";

const startApp = async (): Promise<void> => {
  const appElement = document.querySelector<HTMLDivElement>("#app");

  if (!appElement) {
    throw new Error("Unable to find app element");
  }

  const config = getConfig();

  // TODO: Load the loading screen before the other components
  createSvelteApp(appElement, () => {
    const changeLevel = async () => {
      gameState.currentScene = "loading";
      await application.switchLevel({
        levelName: gameState.selectedLevel,
        onLoadingProgressChanged: (progress) => {
          gameState.loadingPercent = progress;
        },
      });

      gameState.currentScene = "game";
    };

    void changeLevel();
  });

  gameState.loadingPercent = 3;
  const { createApplication } = await import("./application");
  const application = await createApplication(appElement);

  await application.switchLevel({
    levelName: "level-01",
    onLoadingProgressChanged: (progress) => {
      gameState.loadingPercent = progress;
    },
  });

  window.addEventListener("resize", application.handleResize);
  application.handleResize();

  gameState.currentScene = "title";

  if (config.debugControls) {
    const { Pane } = await import("tweakpane");
    const tweakpane = new Pane();

    tweakpane.element.style.position = "absolute";
    tweakpane.element.style.top = "10px";
    tweakpane.element.style.right = "10px";
    tweakpane.element.style.zIndex = "2";

    document.body.appendChild(tweakpane.element);

    const resolutionFolder = tweakpane.addFolder({
      title: "Resolution",
    });

    resolutionFolder
      .addBinding(gameState, "renderQuality", {
        min: 0,
        max: 100,
      })
      .on("change", () => {
        application.setRenderQuality(gameState.renderQuality);
      });
  }
};

void startApp();
