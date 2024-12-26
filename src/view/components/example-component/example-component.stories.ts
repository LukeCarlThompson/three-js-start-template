import type { Meta, StoryObj } from "@storybook/html";
import { createStoryTemplate } from "../story-template";
import type { ExampleComponentProps } from "./example-component";
import { ExampleComponent } from "./example-component";

const meta = {
  title: "Example/Example Component",
  render: ({ dimensions }) => {
    const exampleComponent = new ExampleComponent({ dimensions });

    const { storyElement, viewApplication, tweakpane } = createStoryTemplate();

    tweakpane.addFolder({
      title: "Folder",
    });

    viewApplication.addToScene(exampleComponent);
    viewApplication.addToTicker(exampleComponent.update);
    viewApplication.camera.position.z = 5;

    return storyElement;
  },
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: "fullscreen",
  },
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  args: {
    dimensions: {
      x: 1,
      y: 1,
      z: 1,
    },
  },
} satisfies Meta<ExampleComponentProps>;

export default meta;
type Story = StoryObj<ExampleComponentProps>;

export const Default: Story = {
  args: {
    dimensions: {
      x: 1,
      y: 1,
      z: 1,
    },
  },
};
