import { color, fog, positionWorld, triNoise3D, uniform } from "three/tsl";

import type { FogNode } from "three/webgpu";
import type { ShaderNodeObject } from "three/tsl";

export const createCustomFog = (colour: string): ShaderNodeObject<FogNode> => {
  const timer = uniform(0).onFrameUpdate((frame) => frame.time);

  const lowFrequencyNoise = triNoise3D(positionWorld.mul(0.008), 0.2, timer);
  const highFrequencyNoise = triNoise3D(positionWorld.mul(0.01), 0.3, timer);
  const combinedNoise = lowFrequencyNoise.add(highFrequencyNoise.mul(0.1)).mul(0.5);

  const fogColour = color(colour);

  const fogResult = fog(fogColour, positionWorld.z.sub(5).mul(-0.002).div(combinedNoise).saturate());

  return fogResult;
};
