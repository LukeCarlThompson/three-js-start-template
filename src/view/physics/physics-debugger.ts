import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments } from "three";

import type { World } from "@dimforge/rapier3d";

type PhysicsDebuggerProps = {
  physicsWorld: World;
};

export class PhysicsDebugger {
  #physicsWorld: World;
  #geometry = new BufferGeometry();
  public readonly debugGraphics: LineSegments;

  public constructor({ physicsWorld }: PhysicsDebuggerProps) {
    const material = new LineBasicMaterial({ vertexColors: true });
    this.#physicsWorld = physicsWorld;
    const buffers = physicsWorld.debugRender();
    const vertices = new BufferAttribute(buffers.vertices, 3);
    const colors = new BufferAttribute(buffers.colors, 4);

    this.#geometry.setAttribute("position", vertices);
    this.#geometry.setAttribute("color", colors);

    this.debugGraphics = new LineSegments(this.#geometry, material);
  }

  public readonly update = (): void => {
    const buffers = this.#physicsWorld.debugRender();
    const vertices = new BufferAttribute(buffers.vertices, 3);
    const colors = new BufferAttribute(buffers.colors, 4);

    this.#geometry.setAttribute("position", vertices);
    this.#geometry.setAttribute("color", colors);
  };
}
