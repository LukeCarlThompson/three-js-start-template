import { ExampleComponent } from "./components";
import { Group } from "three";

export class View extends Group {
  #exampleComponent: ExampleComponent;

  public constructor() {
    super();

    this.#exampleComponent = new ExampleComponent({ dimensions: { x: 1, y: 1, z: 1 } });
    this.add(this.#exampleComponent);
  }

  public update = (delta: number): void => {
    this.#exampleComponent.rotation.x = this.#exampleComponent.rotation.x + delta;
    this.#exampleComponent.rotation.y = this.#exampleComponent.rotation.y + delta * 0.5;
  };
}
