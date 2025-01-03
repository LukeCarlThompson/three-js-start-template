import type { ColorRepresentation, Object3D } from "three";
import { Group, Vector3 } from "three";
import type { ImpulseJoint, RigidBody, World } from "@dimforge/rapier3d-compat";

import { JointData } from "@dimforge/rapier3d-compat";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

export type PhysicsObject = Object3D & { rigidBody: RigidBody };

export type SpringProps = {
  parent: PhysicsObject;
  child: PhysicsObject;
  physicsWorld: World;
  jointLength?: number;
  jointStiffness?: number;
  colour?: ColorRepresentation;
};

export class Spring extends Group {
  readonly #line: Line2;
  readonly #joint: ImpulseJoint;
  readonly #physicsWorld: World;
  readonly #positions: Vector3[];

  public constructor({
    parent,
    child,
    jointLength = 1,
    jointStiffness = 3,
    colour = 0x80afcf,
    physicsWorld,
  }: SpringProps) {
    super();
    this.#physicsWorld = physicsWorld;

    const springDescription = JointData.spring(
      jointLength,
      jointStiffness,
      0.2,
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0)
    );
    const material = new LineMaterial({
      color: colour,
      linewidth: 4,
    });
    this.#positions = [parent.position, child.position];
    const geometry = new LineGeometry().setFromPoints(this.#positions);
    this.#line = new Line2(geometry, material);
    this.#joint = this.#physicsWorld.createImpulseJoint(springDescription, parent.rigidBody, child.rigidBody, true);

    this.add(this.#line);
  }

  public readonly update = (_delta: number): void => {
    this.#line.geometry.setFromPoints(this.#positions);
  };

  /**
   * Removes the joint from the physics world
   */
  public readonly destroy = (): void => {
    this.#physicsWorld.removeImpulseJoint(this.#joint, false);
  };
}
