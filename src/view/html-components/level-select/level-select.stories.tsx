import type { Meta, StoryObj } from "@storybook/html";
import { render as preactRender } from "preact";
import { useState } from "preact/hooks";
import type { LevelSelectProps } from "./level-select";
import { LevelSelect } from "./level-select";

const levels = [
  {
    name: "level-01",
    unlocked: true,
  },
  {
    name: "level-02",
    unlocked: true,
  },
  {
    name: "level-03",
    unlocked: false,
  },
  {
    name: "level-04",
    unlocked: false,
  },
];

const meta = {
  title: "HTML/Level Select",
  render: (args, { canvasElement }) => {
    canvasElement.classList.add("pico");

    const storyElement = document.createElement("div");

    const App = () => {
      void args;
      const [selectedName, setSelectedName] = useState("level-01");

      return (
        <LevelSelect
          levels={levels}
          selectedLevelName={selectedName}
          onSelectionClicked={(name) => {
            setSelectedName(name);
          }}
          onConfirmed={(confirmedName) => {
            console.log("clicked -->", confirmedName);
          }}
        />
      );
    };

    preactRender(<App />, storyElement);

    return storyElement;
  },
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: "fullscreen",
  },
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  args: {},
} satisfies Meta<LevelSelectProps>;

export default meta;
type Story = StoryObj<LevelSelectProps>;

export const Default: Story = {
  args: {},
};
