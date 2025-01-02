import { ActiveEvents, CoefficientCombineRule, ColliderDesc, Ray, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import type { Collider, RayColliderHit, RigidBody, World } from "@dimforge/rapier3d-compat";
import { Group, Mesh, Vector3 } from "three";
import { damp, degToRad } from "three/src/math/MathUtils.js";

import type { Object3D } from "three";

export type EnemyProps = {
  physicsWorld: World;
  model: Object3D;
};

export class Enemy extends Group {
  public readonly rigidBody: RigidBody;
  public readonly collider: Collider;
  public readonly impulse = new Vector3();
  readonly #model: Object3D;
  readonly #rayRight: Ray;
  readonly #rayLeft: Ray;
  readonly #physicsWorld: World;
  readonly #config = {
    mass: 5,
    friction: 1,
    horizontalMovementForce: 1.5,
  };
  readonly #state: {
    direction: "left" | "right";
  } = {
    direction: "right",
  };

  public constructor({ physicsWorld, model }: EnemyProps) {
    super();

    this.#physicsWorld = physicsWorld;

    this.#rayRight = new Ray(this.position, { x: 1, y: 0, z: 0 });
    this.#rayLeft = new Ray(this.position, { x: -1, y: 0, z: 0 });

    const { rigidBody, collider } = this.#createPhysicsBody(physicsWorld);
    this.rigidBody = rigidBody;
    this.collider = collider;
    model.position.set(0, 0, 0);

    model.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        return;
      }
    });

    model.castShadow = true;
    model.receiveShadow = true;
    this.#model = model;

    this.add(this.#model);
  }

  public readonly hitLeft = (): RayColliderHit | null => {
    const hitLeft = this.#physicsWorld.castRay(
      this.#rayLeft,
      0.45,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      (collider) => {
        return !collider.isSensor() && collider !== this.collider;
      }
    );
    return hitLeft;
  };

  public readonly hitRight = (): RayColliderHit | null => {
    const hitRight = this.#physicsWorld.castRay(
      this.#rayRight,
      0.45,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      (collider) => {
        return !collider.isSensor() && collider !== this.collider;
      }
    );
    return hitRight;
  };

  public readonly update = (delta: number): void => {
    const position = this.rigidBody.translation();
    const velocity = this.rigidBody.linvel();

    this.position.set(position.x, position.y, position.z);

    if (this.hitLeft()) {
      this.#state.direction = "right";
    } else if (this.hitRight()) {
      this.#state.direction = "left";
    }

    this.impulse.x =
      this.#state.direction === "right"
        ? this.#config.horizontalMovementForce
        : this.#config.horizontalMovementForce * -1;

    this.rigidBody.applyImpulse(this.impulse, true);

    const rotation = velocity.x > 0 ? 70 : -70;
    this.#model.rotation.y = damp(this.#model.rotation.y, degToRad(rotation), 10, delta);

    const tilt = velocity.x > 0 ? 0.1 : -0.1;
    this.rotation.z = damp(this.rotation.z, tilt + velocity.x * -0.03, 10, delta);
  };

  #createPhysicsBody(physicsWorld: World) {
    const rigidBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(this.position.x, this.position.y, this.position.z)
      .enabledTranslations(true, true, false)
      .enabledRotations(false, false, false)
      .setCcdEnabled(true)
      .setLinearDamping(1)
      .setAngularDamping(0)
      .setUserData({
        name: "Enemy",
      });
    const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
    const colliderDesc = ColliderDesc.ball(0.4)
      .setRestitution(0)
      .setDensity(0)
      .setFriction(this.#config.friction)
      .setMass(this.#config.mass)
      .setFrictionCombineRule(CoefficientCombineRule.Min)
      .setRestitutionCombineRule(CoefficientCombineRule.Min)
      .setActiveEvents(ActiveEvents.COLLISION_EVENTS);
    const collider = physicsWorld.createCollider(colliderDesc, rigidBody);

    return {
      collider,
      rigidBody,
    };
  }
}
