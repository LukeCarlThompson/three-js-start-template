import { ACESFilmicToneMapping, VSMShadowMap, WebGLRenderer } from "three";

// TODO: make this work with web gou renderer if supported

export const createRenderer = (): WebGLRenderer => {
  const renderer = new WebGLRenderer({
    powerPreference: "high-performance",
    antialias: true,
  });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;

  return renderer;
};
