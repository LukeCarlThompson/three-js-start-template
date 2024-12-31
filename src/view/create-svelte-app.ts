import SvelteApp from "./SvelteApp.svelte";
import { mount } from "svelte";

export const createSvelteApp = (parentElement: HTMLElement): void => {
  mount(SvelteApp, {
    target: parentElement,
    props: {},
  });
};
