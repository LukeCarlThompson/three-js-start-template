import { ActiveEvents, CoefficientCombineRule, ColliderDesc, Ray, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import type { Collider, RayColliderHit, RigidBody, World } from "@dimforge/rapier3d-compat";
import { damp, degToRad } from "three/src/math/MathUtils.js";

import type { Object3D } from "three";

export type PlayerProps = {
  physicsWorld: World;
  model: Object3D;
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
    playerFriction: 0.25,
    playerVelocityLimit: 10,
    horizontalMovementForce: 100,
    jumpForce: 40,
    wallJumpForce: 40,
    wallJumpHorizontalForce: 40,
    boostForce: 130,
    boostMax: 10000,
    boostUsageRate: 5000,
    boostRegenerationRate: 15000,
  };
  readonly #state: {
    boostRemaining: number;
    direction: "left" | "right";
    isBoosting: boolean;
    hitLeft: boolean;
    hitRight: boolean;
    hitDown: boolean;
  } = {
    boostRemaining: 10000,
    direction: "right",
    isBoosting: false,
    hitLeft: false,
    hitRight: false,
    hitDown: false,
  };

  public constructor({ physicsWorld, model }: PlayerProps) {
    super();

    this.#physicsWorld = physicsWorld;

    this.#rayRight = new Ray(this.position, { x: 1, y: 0, z: 0 });
    this.#rayLeft = new Ray(this.position, { x: -1, y: 0, z: 0 });
    this.#rayDown = new Ray(this.position, { x: 0, y: -1, z: 0 });

    const { rigidBody, collider } = this.#createPhysicsBody(physicsWorld);
    this.rigidBody = rigidBody;
    this.collider = collider;

    this.proximitySensor = this.#createProximitySensor(physicsWorld);

    model.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        return;
      }
    });

    model.castShadow = true;
    model.receiveShadow = true;
    model.position.set(0, -0.45, 0);
    this.#model = model;

    // Boost indicator
    const geometry = new BoxGeometry(0.2, 0.5, 0.2);
    const material = new MeshBasicMaterial({ color: 0xffc400 });
    this.#boostIndicator = new Mesh(geometry, material);
    this.#boostIndicator.position.set(0, 0.3, -0.4);

    this.#model.add(this.#boostIndicator);
    this.add(this.#model);
  }

  public readonly jump = (): void => {
    const { hitLeft, hitRight, hitDown } = this.#state;

    const horizontalForce = hitDown
      ? 0
      : hitRight
      ? this.#config.wallJumpHorizontalForce * -1
      : hitLeft
      ? this.#config.wallJumpHorizontalForce
      : 0;

    const wallJump = !hitDown && (hitRight || hitLeft);
    const verticalForce = hitDown ? this.#config.jumpForce : wallJump ? this.#config.wallJumpForce : 0;

    this.rigidBody.applyImpulse({ x: horizontalForce, y: verticalForce, z: 0 }, true);
  };

  public readonly boost = (delta: number): void => {
    if (this.#state.boostRemaining === 0) return;

    this.impulse.y += this.#config.boostForce;
    this.#state.boostRemaining = Math.max(this.#state.boostRemaining - this.#config.boostUsageRate * delta, 0);
    this.#state.isBoosting = true;
  };

  public readonly moveLeft = (): void => {
    this.impulse.x += this.#config.horizontalMovementForce * -1;
    this.#state.direction = "left";
  };

  public readonly moveRight = (): void => {
    this.impulse.x += this.#config.horizontalMovementForce;
    this.#state.direction = "right";
  };

  public readonly hitLeft = (): RayColliderHit | null => {
    const hitLeft = this.#physicsWorld.castRay(
      this.#rayLeft,
      0.5,
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
      0.5,
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
    this.#updateHitState();

    if (this.impulse.x || this.impulse.y) {
      this.impulse.multiplyScalar(delta);
      this.rigidBody.applyImpulse(this.impulse, true);
    }

    const velocity = this.rigidBody.linvel();
    const hasHorizontalImpulse = Math.abs(this.impulse.x);

    if (Math.abs(velocity.x) > this.#config.playerVelocityLimit) {
      velocity.x = velocity.x * 0.9;
      this.rigidBody.setLinvel(velocity, true);
    }

    if (this.#state.hitDown) {
      this.#state.boostRemaining = Math.min(
        this.#state.boostRemaining + this.#config.boostRegenerationRate * delta,
        this.#config.boostMax
      );
    } else if (hasHorizontalImpulse && (this.#state.hitLeft || this.#state.hitRight)) {
      this.collider.setFrictionCombineRule(CoefficientCombineRule.Max);
    } else {
      this.collider.setFrictionCombineRule(CoefficientCombineRule.Min);
    }

    const rotation = this.#state.direction === "left" ? -70 : 70;
    this.#model.rotation.y = damp(this.#model.rotation.y, degToRad(rotation), 10, delta);

    const tilt = this.#state.direction === "left" ? 0.1 : -0.1;
    this.rotation.z = damp(this.rotation.z, tilt + velocity.x * -0.03, 10, delta);

    const boostPercentRemaining = this.#state.boostRemaining / this.#config.boostMax;
    const boostIndicatorScale = this.#state.isBoosting ? boostPercentRemaining : 0;
    this.#boostIndicator.scale.x = damp(this.#boostIndicator.scale.x, boostIndicatorScale, 10, delta);
    this.#boostIndicator.scale.z = damp(this.#boostIndicator.scale.z, boostIndicatorScale, 10, delta);

    this.#resetImpulse();
    this.#state.isBoosting = false;
  };

  #updateHitState = (): void => {
    this.#state.hitDown = this.hitDown() !== null;
    this.#state.hitLeft = this.hitLeft() !== null;
    this.#state.hitRight = this.hitRight() !== null;
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
  }

  #createPhysicsBody(physicsWorld: World) {
    const rigidBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(this.position.x, this.position.y, this.position.z)
      .enabledTranslations(true, true, false)
      .enabledRotations(false, false, false)
      .setCcdEnabled(false)
      .setLinearDamping(1)
      .setAngularDamping(0)
      .setUserData({
        name: "Player",
      });
    const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
    const colliderDesc = ColliderDesc.ball(0.3)
      .setRestitution(0)
      .setDensity(0)
      .setFriction(this.#config.playerFriction)
      .setMass(this.#config.playerMass)
      .setContactSkin(0.1)
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
    const proximityColliderDesc = ColliderDesc.ball(2)
      .setActiveEvents(ActiveEvents.COLLISION_EVENTS)
      .setSensor(true)
      .setTranslation(this.position.x, this.position.y, this.position.z);
    return physicsWorld.createCollider(proximityColliderDesc);
  }
}
