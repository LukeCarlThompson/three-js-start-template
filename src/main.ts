import "./style.css";

import { View, createViewApplication } from "./view";

const appElement = document.querySelector<HTMLDivElement>("#app");

if (!appElement) {
  throw new Error("Unable to find app element");
}

const viewApplication = createViewApplication(appElement);

viewApplication.start();

const view = new View();

viewApplication.addToScene(view);
viewApplication.addToTicker(view.update);
viewApplication.camera.position.z = 5;
