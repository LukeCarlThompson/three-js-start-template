import type { ViewApplication } from "../../view-application";
import { createViewApplication } from "../../create-view-application";

export const createStoryTemplate = (parentElement: HTMLElement): ViewApplication => {
  const viewApplication = createViewApplication(parentElement);

  viewApplication.start();

  return viewApplication;
};
