import type { JSX } from "preact";
import styles from "./style.module.scss";

export type GameOverlayProps = {
  onClicked?: () => void;
  children?: JSX.Element;
};

export const GameOverlay = ({ onClicked, children }: GameOverlayProps): JSX.Element => {
  return (
    <div className={styles["overlay"]} onClick={onClicked}>
      {children}
    </div>
  );
};
