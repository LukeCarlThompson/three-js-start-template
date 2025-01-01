import SvelteApp from "./SvelteApp.svelte";
import { mount } from "svelte";

export const createSvelteApp = (parentElement: HTMLElement, onStartLevelClicked?: () => void): void => {
  mount(SvelteApp, {
    target: parentElement,
    props: {
      onStartLevelClicked,
    },
  });
};
