import type { EventQueue, World } from "@dimforge/rapier3d";

export const createPhysicsWorld = async (): Promise<{ world: World; eventQueue: EventQueue }> => {
  const Rapier = await import("@dimforge/rapier3d");
  const world = new Rapier.World({ x: 0, y: -30, z: 0 });

  world.numSolverIterations = 1;
  world.numAdditionalFrictionIterations = 1;
  world.numInternalPgsIterations = 1;

  const eventQueue = new Rapier.EventQueue(true);

  return { world, eventQueue };
};