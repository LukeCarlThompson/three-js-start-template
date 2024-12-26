import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three";

export class View extends Group {
  public constructor() {
    super();

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    this.add(cube);
  }

  public update = (delta: number): void => {
    this.rotation.x = this.rotation.x + delta;
  };
}
