import { useRef } from "react";

export function TouchLookPad({ onLook }) {
  const last = useRef(null);
  const frame = useRef(null);

  const move = (event) => {
    const point = event.touches ? event.touches[0] : event;
    if (!last.current) {
      last.current = { x: point.clientX, y: point.clientY };
      return;
    }
    const dx = point.clientX - last.current.x;
    const dy = point.clientY - last.current.y;
    last.current = { x: point.clientX, y: point.clientY };
    onLook({ x: dx, y: dy });
    clearTimeout(frame.current);
    frame.current = setTimeout(() => onLook({ x: 0, y: 0 }), 30);
  };

  const end = () => {
    last.current = null;
    onLook({ x: 0, y: 0 });
  };

  return (
    <div
      className="pointer-events-auto absolute bottom-0 right-0 top-24 z-20 block w-1/2 md:hidden"
      onPointerDown={move}
      onPointerMove={(event) => event.buttons === 1 && move(event)}
      onPointerUp={end}
      onPointerCancel={end}
    />
  );
}
