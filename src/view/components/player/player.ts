import { ActiveEvents, CoefficientCombineRule, ColliderDesc, Ray, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import type { Collider, RayColliderHit, RigidBody, World } from "@dimforge/rapier3d-compat";

import type { Object3D } from "three";

export type PlayerProps = {
  physicsWorld: World;
  model: Object3D;
  position: { x: number; y: number; z: number };
};

export class Player extends Group {
  public readonly rigidBody: RigidBody;
  public readonly collider: Collider;
  public readonly proximitySensor: Collider;
  public readonly impulse = new Vector3();
  readonly #model: Object3D;
  readonly #boostIndicator: Object3D;
  readonly #rayRight: Ray;
  readonly #rayLeft: Ray;
  readonly #rayDown: Ray;
  readonly #physicsWorld: World;
  readonly #config = {
    playerMass: 5,
    playerFriction: 0.5,
    playerVelocityLimit: 10,
    horizontalMovementForce: 200 * 1,
    jumpForce: 60 * 1,
    wallJumpForce: 40 * 1,
    wallJumpHorizontalForce: 60 * 1,
    boostForce: 20000 * 1,
    boostMax: 10000,
    boostUsageRate: 7000,
    boostRegenerationRate: 15000,
    boostCooldownTime: 1,
  };
  readonly #state = {
    boostRemaining: 10000,
    lastBoostTime: 0,
  };

  public constructor({ physicsWorld, model, position }: PlayerProps) {
    super();

    this.#physicsWorld = physicsWorld;

    this.position.set(position.x, position.y, position.z);

    this.#rayRight = new Ray(this.position, { x: 1, y: 0, z: 0 });
    this.#rayLeft = new Ray(this.position, { x: -1, y: 0, z: 0 });
    this.#rayDown = new Ray(this.position, { x: 0, y: -1, z: 0 });

    const { rigidBody, collider } = this.#createPhysicsBody(physicsWorld);
    this.rigidBody = rigidBody;
    this.collider = collider;

    this.proximitySensor = this.#createProximitySensor(physicsWorld);

    this.#model = model;

    // Boost indicator
    const geometry = new BoxGeometry(0.3, 0.3, 0.3);
    const material = new MeshBasicMaterial({ color: 0xffc400 });
    this.#boostIndicator = new Mesh(geometry, material);
    this.#boostIndicator.position.set(0, 0.5, 0);

    this.#model.add(this.#boostIndicator);
    this.add(this.#model);
  }

  public readonly jump = (): void => {
    const hitLeft = this.hitLeft();

    const hitRight = this.hitRight();

    const hitDown = this.hitDown();

    const horizontalForce = hitDown
      ? 0
      : hitRight
      ? this.#config.wallJumpHorizontalForce * -1
      : hitLeft
      ? this.#config.wallJumpHorizontalForce
      : 0;

    const verticalForce = hitRight || hitLeft ? this.#config.wallJumpForce : this.#config.jumpForce;

    this.rigidBody.applyImpulse({ x: horizontalForce, y: verticalForce, z: 0 }, true);
  };

  public readonly boost = (delta: number): void => {
    if (this.#state.boostRemaining === 0) return;
    this.impulse.y += this.#config.boostForce * delta;
    this.#state.boostRemaining = Math.max(this.#state.boostRemaining - this.#config.boostUsageRate * delta, 0);

    this.#state.lastBoostTime = 0;
  };

  public readonly moveLeft = (): void => {
    this.impulse.x += this.#config.horizontalMovementForce * -1;
  };

  public readonly moveRight = (): void => {
    this.impulse.x += this.#config.horizontalMovementForce;
  };

  public readonly hitLeft = (): RayColliderHit | null => {
    const hitLeft = this.#physicsWorld.castRay(
      this.#rayLeft,
      0.6,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      (collider) => {
        return collider !== this.collider;
      }
    );
    return hitLeft;
  };

  public readonly hitRight = (): RayColliderHit | null => {
    const hitRight = this.#physicsWorld.castRay(
      this.#rayRight,
      0.6,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      (collider) => {
        return collider !== this.collider;
      }
    );
    return hitRight;
  };

  public readonly hitDown = (): RayColliderHit | null => {
    const hitDown = this.#physicsWorld.castRay(
      this.#rayDown,
      0.6,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      (collider) => {
        return collider !== this.collider;
      }
    );
    return hitDown;
  };

  public readonly update = (delta: number): void => {
    this.#syncWithPhysics();

    if (this.impulse.x || this.impulse.y) {
      this.impulse.multiplyScalar(delta);
      this.rigidBody.applyImpulse(this.impulse, true);
    }

    const velocity = this.rigidBody.linvel();

    if (Math.abs(velocity.x) > this.#config.playerVelocityLimit) {
      velocity.x = velocity.x * 0.9;
      this.rigidBody.setLinvel(velocity, true);
    }

    if (this.#state.lastBoostTime > this.#config.boostCooldownTime && this.hitDown()) {
      this.#state.boostRemaining = Math.min(
        this.#state.boostRemaining + this.#config.boostRegenerationRate * delta,
        this.#config.boostMax
      );
    }

    this.#state.lastBoostTime += delta;

    const boostPercentRemaining = this.#state.boostRemaining / this.#config.boostMax;
    this.#boostIndicator.scale.set(boostPercentRemaining, boostPercentRemaining, boostPercentRemaining);

    const frictionCombineRule =
      !this.hitDown() && (this.hitLeft() || this.hitRight()) ? CoefficientCombineRule.Max : CoefficientCombineRule.Min;
    this.collider.setFrictionCombineRule(frictionCombineRule);

    this.#resetImpulse();
  };

  #resetImpulse = (): void => {
    this.impulse.x = 0;
    this.impulse.y = 0;
    this.impulse.z = 0;
  };

  #syncWithPhysics() {
    const position = this.rigidBody.translation();
    this.proximitySensor.setTranslation(position);
    this.position.set(position.x, position.y, position.z);
    const velocity = this.rigidBody.linvel();
    this.#model.rotation.z = velocity.x * -0.03;
  }

  #createPhysicsBody(physicsWorld: World) {
    const rigidBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(this.position.x, this.position.y, this.position.z)
      .enabledTranslations(true, true, false)
      .enabledRotations(false, false, false)
      .setCcdEnabled(true)
      .setLinearDamping(1)
      .setAngularDamping(0)
      .setUserData({
        name: "Player",
      });
    const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
    const colliderDesc = ColliderDesc.ball(0.4)
      .setRestitution(0)
      .setDensity(0)
      .setFriction(this.#config.playerFriction)
      .setMass(this.#config.playerMass)
      .setFrictionCombineRule(CoefficientCombineRule.Min)
      .setRestitutionCombineRule(CoefficientCombineRule.Min)
      .setActiveEvents(ActiveEvents.COLLISION_EVENTS);
    const collider = physicsWorld.createCollider(colliderDesc, rigidBody);

    return {
      collider,
      rigidBody,
    };
  }

  #createProximitySensor(physicsWorld: World) {
    // TODO: Current bug in physics lib means sensor requires a rigibody. When the bug is fixed we can just use the collider by itself.
    const sensorRigidBodyDesc = RigidBodyDesc.fixed()
      .setTranslation(this.position.x, this.position.y, this.position.z)
      .setUserData({ name: "proximity sensor rigid body" });
    const proximitySensor = physicsWorld.createRigidBody(sensorRigidBodyDesc);
    const proximityColliderDesc = ColliderDesc.ball(2).setActiveEvents(ActiveEvents.COLLISION_EVENTS).setSensor(true);
    return physicsWorld.createCollider(proximityColliderDesc, proximitySensor);
  }
}
