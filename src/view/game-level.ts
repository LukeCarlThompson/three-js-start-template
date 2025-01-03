import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

import { ActiveEvents, ColliderDesc } from "@dimforge/rapier3d-compat";
import {
  BatchedMesh,
  Color,
  Fog,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  PointLight,
  Scene,
  SpotLight,
} from "three";
import type { BufferGeometry, Material, Object3D, PerspectiveCamera } from "three";
import type { Collider, EventQueue, World } from "@dimforge/rapier3d-compat";
import { Enemy, MoveableBlock } from "./components";

import type { Player } from "./components";
import { createCustomFog } from "./custom-fog";
import { damp } from "three/src/math/MathUtils.js";

export type GameLevelProps = {
  environmentModel: Object3D;
  player: Player;
  camera: PerspectiveCamera;
  physicsWorld: World;
  physicsEventQueue: EventQueue;
  onReachedGoal: () => void;
  onPlayerDie: () => void;
};

type CollisionEvent = "player-hit-enemy" | "player-hit-goal" | "player-hit-danger";

export class GameLevel extends Scene {
  public readonly playerMovement = {
    up: false,
    right: false,
    left: false,
  };
  #camera: PerspectiveCamera;
  #player: Player;
  #physicsWorld: World;
  #eventQueue: EventQueue;
  #config: {
    cameraFollowDistance: number;
    cameraVerticalOffset: number;
    renderDistance: number;
  };
  #terrainColliders: Collider[] = [];
  #dangerSensors: Collider[] = [];
  #enemies: Enemy[] = [];
  #moveableBlocks: MoveableBlock[] = [];
  #goalSensor?: Collider = undefined;
  #spotLight?: SpotLight | PointLight;
  #onReachedGoal: () => void;
  #onPlayerDie: () => void;

  public constructor({
    environmentModel,
    player,
    camera,
    physicsWorld,
    physicsEventQueue,
    onReachedGoal,
    onPlayerDie,
  }: GameLevelProps) {
    super();
    const cameraFollowDistance = 80;
    this.#config = {
      cameraFollowDistance,
      cameraVerticalOffset: 2,
      renderDistance: cameraFollowDistance + 50,
    };

    this.#player = player;
    this.#onReachedGoal = onReachedGoal;
    this.#onPlayerDie = onPlayerDie;

    this.#physicsWorld = physicsWorld;
    this.#eventQueue = physicsEventQueue;
    this.fog = new Fog(0x456475, this.#config.cameraFollowDistance * 0.9, this.#config.renderDistance);
    this.background = this.fog.color;

    this.#camera = camera;
    this.#camera.far = this.#config.renderDistance;
    this.#camera.fov = 10;
    this.#camera.position.set(0, 3, this.#config.cameraFollowDistance);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objectsToAddToBatchedMesh: Mesh<any, any, any>[] = [];
    const objectsToAddToToScene: Object3D[] = [];
    const meshesToMakeEnemies: Object3D[] = [];
    const meshesToMakeMoveableBlocks: Mesh[] = [];
    let environmentMaterial: Material = new MeshLambertMaterial({
      forceSinglePass: true,
    });

    let verticesCount = 0;
    let indexCount = 0;

    environmentModel.traverse((child) => {
      if (child.name.includes("user-data")) {
        if ("backgroundColour" in child.userData && typeof child.userData.backgroundColour === "string") {
          const { backgroundColour } = child.userData;
          const colour = new Color(backgroundColour);
          this.fog?.color.set(colour);
          this.background = colour;

          const fogNode = createCustomFog(backgroundColour);

          this.fogNode = fogNode;
        }
        return;
      }

      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        environmentMaterial = child.material as Material;

        // Create enemy
        if (child.name.includes("enemy")) {
          meshesToMakeEnemies.push(child);
          return;
        }

        if (child.name.includes("moveable-block")) {
          meshesToMakeMoveableBlocks.push(child as Mesh);
          return;
        }

        objectsToAddToBatchedMesh.push(child);

        // Count vertices and indexes for batched mesh
        if ("position" in (child.geometry as BufferGeometry).attributes) {
          verticesCount += (child.geometry as BufferGeometry).attributes.position.count;
          indexCount += (child.geometry as BufferGeometry).index?.count || 0;
        }

        // Create sensor for goal
        if (child.name.includes("goal_sensor")) {
          const bufferGeometry = BufferGeometryUtils.mergeVertices(child.geometry as BufferGeometry);
          bufferGeometry.scale(child.scale.x, child.scale.y, child.scale.z);
          const vertices = bufferGeometry.attributes.position.array as Float32Array;
          const indices = bufferGeometry.index?.array as Uint32Array;
          const colliderDesc = ColliderDesc.trimesh(vertices, indices);
          colliderDesc.translation = child.position;
          colliderDesc.rotation = child.quaternion;
          colliderDesc.setSensor(true).setActiveEvents(ActiveEvents.COLLISION_EVENTS);
          this.#goalSensor = physicsWorld.createCollider(colliderDesc);

          return;
        }

        // Create sensor for danger
        if (child.name.includes("danger")) {
          const bufferGeometry = BufferGeometryUtils.mergeVertices(child.geometry as BufferGeometry);
          bufferGeometry.scale(child.scale.x, child.scale.y, child.scale.z);
          const vertices = bufferGeometry.attributes.position.array as Float32Array;
          const indices = bufferGeometry.index?.array as Uint32Array;
          const colliderDesc = ColliderDesc.trimesh(vertices, indices);
          colliderDesc.translation = child.position;
          colliderDesc.rotation = child.quaternion;
          colliderDesc.setSensor(true).setActiveEvents(ActiveEvents.COLLISION_EVENTS);
          this.#dangerSensors.push(physicsWorld.createCollider(colliderDesc));

          return;
        }

        // Create collider
        if (child.name.includes("Ground")) {
          const bufferGeometry = BufferGeometryUtils.mergeVertices(child.geometry as BufferGeometry);
          bufferGeometry.scale(child.scale.x, child.scale.y, child.scale.z);
          const vertices = bufferGeometry.attributes.position.array as Float32Array;
          const indices = bufferGeometry.index?.array as Uint32Array;
          const colliderDesc = ColliderDesc.trimesh(vertices, indices);
          colliderDesc.translation = child.position;
          colliderDesc.rotation = child.quaternion;
          colliderDesc.friction = 30;
          this.#terrainColliders.push(physicsWorld.createCollider(colliderDesc));
        }
        return;
      }

      if (child instanceof PointLight || child instanceof SpotLight) {
        child.castShadow = true;
        child.shadow.camera.near = 10;
        child.shadow.camera.far = child.position.distanceTo(this.#player.position) + 10;
        child.shadow.radius = 2;
        child.shadow.blurSamples = 5;
        child.shadow.bias = -0.005;
        child.lookAt(this.#player.position);
        this.#spotLight = child;
        objectsToAddToToScene.push(this.#spotLight);
      }
    });

    meshesToMakeEnemies.forEach((mesh) => {
      const enemy = new Enemy({ physicsWorld: this.#physicsWorld, model: mesh });
      this.#enemies.push(enemy);
      this.add(enemy);
    });

    meshesToMakeMoveableBlocks.forEach((mesh) => {
      const moveableBlock = new MoveableBlock({ physicsWorld: this.#physicsWorld, model: mesh });
      this.#moveableBlocks.push(moveableBlock);
      this.add(moveableBlock);
    });

    const batchedMesh = new BatchedMesh(
      environmentModel.children.length,
      verticesCount,
      indexCount,
      environmentMaterial
    );

    batchedMesh.castShadow = true;
    batchedMesh.receiveShadow = true;
    // batchedMesh.perObjectFrustumCulled = false;
    // batchedMesh.sortObjects = false;

    objectsToAddToBatchedMesh.forEach((object) => {
      const geometryId = batchedMesh.addGeometry(object.geometry as BufferGeometry);
      const instancedId = batchedMesh.addInstance(geometryId);
      batchedMesh.setMatrixAt(instancedId, object.matrix);
    });

    this.add(batchedMesh, ...objectsToAddToToScene, this.#player, new HemisphereLight(0xffffff, 0x080820, 0.1));
  }

  public readonly setShadowMapQuality = (quality: number): void => {
    if (!this.#spotLight) return;
    const multiplier = (quality * 0.9 + 10) * 0.01;
    const shadowMapDimension = Math.round(2048 * multiplier);
    this.#spotLight.shadow.mapSize.set(shadowMapDimension, shadowMapDimension);
    this.#spotLight.shadow.map?.setSize(shadowMapDimension, shadowMapDimension);
  };

  public readonly jumpPressed = (): void => {
    this.#player.jump();
  };

  public readonly reset = (): void => {
    const vector3 = { x: 0, y: 0, z: 0 };
    this.#player.rigidBody.setTranslation(vector3, true);
    this.#player.rigidBody.setLinvel(vector3, true);
    this.#enemies.forEach((enemy) => {
      enemy.reset();
    });
    this.#moveableBlocks.forEach((block) => {
      block.reset();
    });
  };

  /**
   * Removes any assets unique to this scene from memory.
   * Removes any physics objects unique to this scene.
   */
  public readonly destroy = (): void => {
    // TODO: Remove all meshes
    // Remove all textures
    // Remove all sounds
    // Remove all colliders and rigid bodies
    this.#terrainColliders.forEach((collider) => {
      this.#physicsWorld.removeCollider(collider, true);
    });
    this.#dangerSensors.forEach((collider) => {
      this.#physicsWorld.removeCollider(collider, true);
    });
    this.#enemies.forEach((enemy) => {
      enemy.destroy();
    });
    this.#moveableBlocks.forEach((block) => {
      block.destroy();
    });
  };

  public update = (delta: number): void => {
    if (this.playerMovement.right) {
      this.#player.moveRight();
    }
    if (this.playerMovement.left) {
      this.#player.moveLeft();
    }
    if (this.playerMovement.up) {
      this.#player.boost(delta);
    }

    const dampXMultiplier =
      Math.abs(this.#camera.position.x - this.#player.position.x) *
      Math.abs(this.#camera.position.x - this.#player.position.x);
    const dampYMultiplier =
      Math.abs(this.#camera.position.y - this.#player.position.y) *
      Math.abs(this.#camera.position.y - this.#player.position.y);

    this.#camera.position.x = damp(this.#camera.position.x, this.#player.position.x, dampXMultiplier, delta);
    this.#camera.position.y = damp(
      this.#camera.position.y,
      this.#player.position.y + this.#config.cameraVerticalOffset,
      dampYMultiplier,
      delta
    );
    this.#camera.position.z = damp(
      this.#camera.position.z,
      this.#player.position.z + this.#config.cameraFollowDistance,
      dampYMultiplier,
      delta
    );

    this.#eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      const eventName = this.#processCollisionEvent(started, handle1, handle2);

      switch (eventName) {
        case "player-hit-danger":
          this.#onPlayerDie();
          break;
        case "player-hit-enemy":
          this.#onPlayerDie();
          break;
        case "player-hit-goal":
          this.#onReachedGoal();
          break;
      }
    });

    if (this.#spotLight) {
      this.#spotLight.position.x = this.#player.position.x;
      this.#spotLight.position.y = this.#player.position.y + 10;
    }

    this.#physicsWorld.timestep = delta;
    this.#physicsWorld.step(this.#eventQueue);

    this.#player.update(delta);
    this.#enemies.forEach((enemy) => {
      enemy.update(delta);
    });
    this.#moveableBlocks.forEach((block) => {
      block.update(delta);
    });
  };

  #processCollisionEvent = (started: boolean, handle1: number, handle2: number): CollisionEvent | undefined => {
    const goal = this.#goalSensor?.handle === handle1 || this.#goalSensor?.handle === handle2;

    const danger: boolean =
      this.#dangerSensors.filter((sensor) => {
        return sensor.handle === handle1 || sensor.handle === handle2;
      }).length > 0;

    const player = handle1 === this.#player.rigidBody.handle || handle2 === this.#player.rigidBody.handle;

    const enemy =
      this.#enemies.filter((enemy) => {
        return enemy.collider.handle === handle1 || enemy.collider.handle === handle2;
      }).length > 0;

    const playerHitGoal = started && goal && player;
    const playerHitEnemy = started && player && enemy;
    const playerHitDanger = started && player && danger;

    if (playerHitGoal) {
      return "player-hit-goal";
    }
    if (playerHitEnemy) {
      return "player-hit-enemy";
    }
    if (playerHitDanger) {
      return "player-hit-danger";
    }
  };
}
