import { Fog, HemisphereLight, Scene } from "three";

import { ExampleComponent } from "./components";

export class View extends Scene {
  #exampleComponent: ExampleComponent;

  public constructor() {
    super();

    this.#exampleComponent = new ExampleComponent({ dimensions: { x: 1, y: 1, z: 1 } });
    this.add(this.#exampleComponent);

    this.add(new HemisphereLight(0xffffff, 0x080820, 1.5));
    this.fog = new Fog(0xffffff, 10, 100);
  }

  public update = (delta: number): void => {
    this.#exampleComponent.rotation.x = this.#exampleComponent.rotation.x + delta;
    this.#exampleComponent.rotation.y = this.#exampleComponent.rotation.y + delta * 0.5;
  };
}
