import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three";

export type ExampleComponentProps = {
  dimensions: { x: number; y: number; z: number };
};

export class ExampleComponent extends Group {
  public constructor({ dimensions: { x, y, z } }: ExampleComponentProps) {
    super();

    const geometry = new BoxGeometry(x, y, z);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    this.add(cube);
  }

  public update = (delta: number): void => {
    this.rotation.x = this.rotation.x + delta;
    this.rotation.y = this.rotation.y + delta * 0.5;
  };
}