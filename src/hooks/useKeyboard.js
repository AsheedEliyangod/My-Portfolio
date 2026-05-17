import { useEffect } from "react";
import { useGame } from "../state/GameContext.jsx";

export function useKeyboard() {
  const { input } = useGame();

  useEffect(() => {
    const down = (event) => {
      input.current.keys[event.code] = true;
    };
    const up = (event) => {
      input.current.keys[event.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [input]);
}
