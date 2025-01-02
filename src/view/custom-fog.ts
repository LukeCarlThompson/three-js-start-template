import { color, fog, positionWorld, time, triNoise3D, vec3 } from "three/tsl";

import type { FogNode } from "three/webgpu";
import type { ShaderNodeObject } from "three/tsl";

export const createCustomFog = (colour: string): ShaderNodeObject<FogNode> => {
  const multiplier = vec3(1, 1, 0.2);

  const lowFrequencyNoise = triNoise3D(positionWorld.mul(multiplier).mul(0.008), 0.2, time);
  const highFrequencyNoise = triNoise3D(positionWorld.mul(multiplier).mul(0.01), 0.3, time);
  const combinedNoise = lowFrequencyNoise.add(highFrequencyNoise.mul(0.2)).mul(0.7);

  const fogColour = color(colour);

  const fogResult = fog(fogColour, positionWorld.z.sub(4).mul(-0.003).div(combinedNoise).saturate());

  return fogResult;
};
