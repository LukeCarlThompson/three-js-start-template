import { ViewApplication } from "./view-application";

export const createViewApplication = (parentElement: HTMLElement): ViewApplication => {
  const viewApplication = new ViewApplication({
    rendererParentElement: parentElement,
    renderQualityPercentage: 100,
    renderMaxPixelLimit: 1920 * 1080,
    renderMinPixelLimit: 400 * 600,
  });

  window.addEventListener("resize", () => {
    const { clientWidth, clientHeight } = parentElement;

    viewApplication.handleResize(clientWidth, clientHeight);
  });

  return viewApplication;
};
