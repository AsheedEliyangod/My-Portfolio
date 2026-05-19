import { useRef } from "react";

export function TouchLookPad({ onLook }) {
  const last = useRef(null);
  const frame = useRef(null);
  const activePointer = useRef(null);

  const move = (event) => {
    event.preventDefault();
    if (activePointer.current !== event.pointerId) return;
    if (!last.current) {
      last.current = { x: event.clientX, y: event.clientY };
      return;
    }
    const dx = event.clientX - last.current.x;
    const dy = event.clientY - last.current.y;
    last.current = { x: event.clientX, y: event.clientY };
    onLook({ x: dx, y: dy });
    clearTimeout(frame.current);
    frame.current = setTimeout(() => onLook({ x: 0, y: 0 }), 30);
  };

  const start = (event) => {
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    move(event);
  };

  const end = (event) => {
    if (event?.pointerId !== undefined && activePointer.current !== event.pointerId) return;
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointer.current = null;
    last.current = null;
    clearTimeout(frame.current);
    onLook({ x: 0, y: 0 });
  };

  return (
    <div
      className="pointer-events-auto absolute bottom-0 right-0 top-24 z-20 block w-1/2 md:hidden"
      style={{ touchAction: "none" }}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    />
  );
}
