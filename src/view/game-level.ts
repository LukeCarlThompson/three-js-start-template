import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

import { ActiveEvents, ColliderDesc } from "@dimforge/rapier3d-compat";
import { BatchedMesh, Fog, HemisphereLight, Mesh, MeshLambertMaterial, PointLight, Scene, SpotLight } from "three";
import type { BufferGeometry, Material, Object3D, PerspectiveCamera } from "three";
import type { Collider, EventQueue, World } from "@dimforge/rapier3d-compat";

import { ExampleComponent } from "./components";
import type { Player } from "./components";
import { damp } from "three/src/math/MathUtils.js";

export type GameLevelProps = {
  environmentModel: Object3D;
  player: Player;
  camera: PerspectiveCamera;
  physicsWorld: World;
  physicsEventQueue: EventQueue;
  onReachedGoal: () => void;
};

export class GameLevel extends Scene {
  public readonly playerMovement = {
    up: false,
    right: false,
    left: false,
  };
  #camera: PerspectiveCamera;
  #exampleComponent: ExampleComponent;
  #player: Player;
  #physicsWorld: World;
  #eventQueue: EventQueue;
  #config: {
    cameraFollowDistance: number;
    cameraVerticalOffset: number;
    renderDistance: number;
  };
  #terrainColliders: Collider[] = [];
  #goalSensor?: Collider = undefined;
  #spotLight?: SpotLight | PointLight;
  #onReachedGoal: () => void;

  public constructor({
    environmentModel,
    player,
    camera,
    physicsWorld,
    physicsEventQueue,
    onReachedGoal,
  }: GameLevelProps) {
    super();
    const cameraFollowDistance = 80;
    this.#config = {
      cameraFollowDistance,
      cameraVerticalOffset: 2,
      renderDistance: cameraFollowDistance + 50,
    };

    this.#onReachedGoal = onReachedGoal;

    this.#physicsWorld = physicsWorld;
    this.#eventQueue = physicsEventQueue;
    this.fog = new Fog(0x456475, this.#config.cameraFollowDistance * 0.9, this.#config.renderDistance);
    this.background = this.fog.color;

    this.#camera = camera;
    this.#camera.far = this.#config.renderDistance;
    this.#camera.fov = 10;
    this.#camera.position.set(0, 3, this.#config.cameraFollowDistance);
    this.#exampleComponent = new ExampleComponent({ dimensions: { x: 1, y: 1, z: 1 } });
    this.#exampleComponent.position.y = 8;

    this.#player = player;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objectsToAddToBatchedMesh: Mesh<any, any, any>[] = [];
    const objectsToAddToToScene: Object3D[] = [];
    let environmentMaterial: Material = new MeshLambertMaterial({
      forceSinglePass: true,
    });

    environmentModel.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        environmentMaterial = child.material as Material;
        objectsToAddToBatchedMesh.push(child);

        // Create sensor
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

    const batchedMesh = new BatchedMesh(environmentModel.children.length, 5000, 10000, environmentMaterial);

    batchedMesh.castShadow = true;
    batchedMesh.receiveShadow = true;
    // batchedMesh.perObjectFrustumCulled = false;
    // batchedMesh.sortObjects = false;

    objectsToAddToBatchedMesh.forEach((object) => {
      const geometryId = batchedMesh.addGeometry(object.geometry as BufferGeometry);
      const instancedId = batchedMesh.addInstance(geometryId);
      batchedMesh.setMatrixAt(instancedId, object.matrix);
    });

    this.add(
      this.#exampleComponent,
      batchedMesh,
      ...objectsToAddToToScene,
      this.#player,
      new HemisphereLight(0xffffff, 0x080820, 0.1)
    );
  }

  public readonly setShadowMapQuality = (quality: number): void => {
    if (!this.#spotLight) return;
    const multiplier = (quality * 0.9 + 10) * 0.01;
    const shadowMapDimension = Math.round(2048 * multiplier);
    console.log(multiplier);
    this.#spotLight.shadow.mapSize.set(shadowMapDimension, shadowMapDimension);
    this.#spotLight.shadow.map?.setSize(shadowMapDimension, shadowMapDimension);
  };

  public readonly jumpPressed = (): void => {
    let canJump = false;

    this.#terrainColliders.forEach((terrainCollider) => {
      this.#physicsWorld.contactPair(this.#player.collider, terrainCollider, () => {
        canJump = true;
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (canJump) {
      this.#player.jump();
    }
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

    // TODO: Set some bounds based on screen size
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
      const goal = this.#goalSensor?.handle === handle1 || this.#goalSensor?.handle === handle2;

      if (started && goal) {
        this.#onReachedGoal();
      }
    });

    if (this.#spotLight) {
      this.#spotLight.position.x = this.#player.position.x;
      this.#spotLight.position.y = this.#player.position.y + 10;
    }

    this.#physicsWorld.timestep = delta;
    this.#physicsWorld.step(this.#eventQueue);

    this.#player.update(delta);
  };
}