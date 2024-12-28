export class UserInput {
  public readonly state = {
    joystick: {
      x: 0,
      y: 0,
    },
    left: false,
    right: false,
    up: false,
    down: false,
  };
  #touchStart = {
    x: 0,
    y: 0,
  };
  readonly #gameKeys = ["w", "a", "d", "s", " ", "ArrowUp", "ArrowLeft", "ArrowRight", "ArrowDown"];
  #parentElement: HTMLElement;

  public constructor(parentElement: HTMLElement) {
    this.#parentElement = parentElement;

    parentElement.addEventListener("keydown", this.#keyDownHandler);
    parentElement.addEventListener("keyup", this.#keyUpHandler);
    parentElement.addEventListener("mousedown", this.#mouseDownHandler);
    parentElement.addEventListener("mouseup", this.#mouseUpHandler);
    parentElement.addEventListener("touchstart", this.#touchStartHandler);
    parentElement.addEventListener("touchend", this.#touchEndHandler);
    parentElement.addEventListener("mousemove", this.#mouseMovehandler);
    parentElement.addEventListener("touchmove", this.#touchMoveHandler);
  }

  #keyDownHandler = (e: KeyboardEvent) => {
    if (this.#gameKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.repeat) return;

    if (e.key === "w" || e.key === "ArrowUp" || e.key === " ") {
      this.state.up = true;
    } else if (e.key === "s" || e.key === "ArrowDown") {
      this.state.down = true;
    } else if (e.key === "a" || e.key === "ArrowLeft") {
      this.state.left = true;
    } else if (e.key === "d" || e.key === "ArrowRight") {
      this.state.right = true;
    }
  };

  readonly #keyUpHandler = (e: KeyboardEvent) => {
    if (this.#gameKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.repeat) return;

    if (e.key === "w" || e.key === "ArrowUp" || e.key === " ") {
      this.state.up = false;
    } else if (e.key === "s" || e.key === "ArrowDown") {
      this.state.down = false;
    } else if (e.key === "a" || e.key === "ArrowLeft") {
      this.state.left = false;
    } else if (e.key === "d" || e.key === "ArrowRight") {
      this.state.right = false;
    }
  };

  readonly #mouseDownHandler = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.button === 0) {
      this.#touchStart.x = e.clientX;
      this.#touchStart.y = e.clientY;
    }
  };

  readonly #mouseUpHandler = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  readonly #touchStartHandler = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    this.state.joystick.x = 0;
    this.state.joystick.y = 0;
    this.#touchStart.x = e.touches[0].clientX;
    this.#touchStart.y = e.touches[0].clientY;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (e.touches[1]) {
      this.state.up = true;
    }
  };

  readonly #touchMoveHandler = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = this.#parentElement.getBoundingClientRect();

    this.state.joystick.x = (this.#touchStart.x - e.touches[0].clientX - rect.left) * -1;
    this.state.joystick.y = this.#touchStart.y - e.touches[0].clientY - rect.top;
  };

  readonly #touchEndHandler = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    this.state.joystick.x = 0;
    this.state.joystick.y = 0;
    this.state.up = false;
  };

  readonly #mouseMovehandler = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = this.#parentElement.getBoundingClientRect();

    if (e.buttons === 0) {
      this.state.joystick.x = (this.#touchStart.x - e.clientX - rect.left) * -1;
      this.state.joystick.y = this.#touchStart.y - e.clientY - rect.top;
    }
  };
}
