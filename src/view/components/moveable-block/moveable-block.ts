import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

import { CoefficientCombineRule, ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import type { Collider, RigidBody, World } from "@dimforge/rapier3d-compat";
import { Group, Mesh, Vector3 } from "three";

export type MoveableBlockProps = {
  physicsWorld: World;
  model: Mesh;
};

export class MoveableBlock extends Group {
  public readonly rigidBody: RigidBody;
  public readonly collider: Collider;
  readonly #model: Mesh;
  readonly #physicsWorld: World;
  readonly #config = {
    mass: 4,
    friction: 0.2,
    restitution: 0,
    linearDamping: 0.5,
    angularDamping: 0.1,
  };
  readonly #startPositon: Vector3;

  public constructor({ physicsWorld, model }: MoveableBlockProps) {
    super();

    this.#physicsWorld = physicsWorld;
    const { x, y, z } = model.position;
    this.#startPositon = new Vector3(x, y + 2, z);
    model.position.set(0, 0, 0);

    const { rigidBody, collider } = this.#createPhysicsBody(physicsWorld, model);
    this.rigidBody = rigidBody;
    this.collider = collider;

    model.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        return;
      }
    });

    model.castShadow = true;
    model.receiveShadow = true;
    this.scale.set(1.1, 1.1, 1.1);
    this.#model = model;

    this.add(this.#model);
  }

  public readonly update = (_delta: number): void => {
    const position = this.rigidBody.translation();
    const { x, y, z, w } = this.rigidBody.rotation();

    this.position.set(position.x, position.y, position.z);
    this.quaternion.set(x, y, z, w);
  };

  /**
   * Removes the collider and rigid body from the physics world
   */
  public readonly destroy = (): void => {
    this.#physicsWorld.removeCollider(this.collider, false);
    this.#physicsWorld.removeRigidBody(this.rigidBody);
  };

  /**
   * Sets the object back to it's starting state
   */
  public readonly reset = (): void => {
    this.rigidBody.setTranslation(this.#startPositon, true);
  };

  #createPhysicsBody(physicsWorld: World, child: Mesh) {
    const bufferGeometry = BufferGeometryUtils.mergeVertices(child.geometry);
    bufferGeometry.scale(child.scale.x, child.scale.y, child.scale.z);
    const vertices = bufferGeometry.attributes.position.array as Float32Array;
    const indices = bufferGeometry.index?.array as Uint32Array;

    const { x, y, z } = this.#startPositon;
    const rigidBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .setRotation(child.quaternion)
      .enabledTranslations(true, true, false)
      .enabledRotations(false, false, true)
      .setCcdEnabled(false)
      .setLinearDamping(this.#config.linearDamping)
      .setAngularDamping(this.#config.angularDamping)
      .setUserData({
        name: "MoveableBlock",
      });

    const colliderDesc = ColliderDesc.trimesh(vertices, indices)
      .setRestitution(this.#config.restitution)
      .setFriction(this.#config.friction)
      .setMass(this.#config.mass)
      .setContactSkin(0.1)
      .setFrictionCombineRule(CoefficientCombineRule.Min)
      .setRestitutionCombineRule(CoefficientCombineRule.Min);

    const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
    const collider = physicsWorld.createCollider(colliderDesc, rigidBody);

    return {
      collider,
      rigidBody,
    };
  }
}
