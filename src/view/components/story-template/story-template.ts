import { Pane } from "tweakpane";
import type { ViewApplication } from "../../view-application";
import { createViewApplication } from "../../create-view-application";

export const createStoryTemplate = (
  parentElement: HTMLElement
): { viewApplication: ViewApplication; tweakpane: Pane } => {
  const viewApplication = createViewApplication(parentElement);

  viewApplication.start();

  const tweakpane = new Pane();

  tweakpane.element.style.position = "absolute";
  tweakpane.element.style.top = "10px";
  tweakpane.element.style.right = "10px";
  tweakpane.element.style.zIndex = "2";

  parentElement.appendChild(tweakpane.element);

  return { viewApplication, tweakpane };
};
