import { ViewApplication } from "./view-application";

export const createViewApplication = (
  parentElement: HTMLElement,
  beforeUpdate?: () => void,
  afterUpdate?: () => void
): ViewApplication => {
  const viewApplication = new ViewApplication({
    rendererParentElement: parentElement,
    renderQualityPercentage: 100,
    renderMaxPixelLimit: 1920 * 1080,
    renderMinPixelLimit: 400 * 600,
    beforeUpdate,
    afterUpdate,
  });

  window.addEventListener("resize", () => {
    const { clientWidth, clientHeight } = parentElement;

    viewApplication.handleResize(clientWidth, clientHeight);
  });

  return viewApplication;
};
