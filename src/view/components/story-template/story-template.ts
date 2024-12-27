import { Pane } from "tweakpane";
import Stats from "stats-gl";
import type { ViewApplication } from "../../view-application";
import { createViewApplication } from "../../create-view-application";

export const createStoryTemplate = (): {
  storyElement: HTMLElement;
  viewApplication: ViewApplication;
  tweakpane: Pane;
} => {
  const storyElement = document.createElement("div");
  storyElement.style.position = "absolute";
  storyElement.style.top = "0";
  storyElement.style.left = "0";
  storyElement.style.width = "100%";
  storyElement.style.height = "100%";

  const stats = new Stats({
    trackGPU: true,
    trackHz: false,
    trackCPT: false,
  });

  const viewApplication = createViewApplication(
    storyElement,
    () => {
      stats.begin();
    },
    () => {
      stats.end();
      stats.update();
    }
  );

  void stats.init(viewApplication.renderer);

  viewApplication.start();

  const tweakpane = new Pane();

  tweakpane.element.style.position = "absolute";
  tweakpane.element.style.top = "10px";
  tweakpane.element.style.right = "10px";
  tweakpane.element.style.zIndex = "2";

  storyElement.appendChild(tweakpane.element);

  storyElement.appendChild(stats.dom);

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

  return { storyElement, viewApplication, tweakpane };
};
