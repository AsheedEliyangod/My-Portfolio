import { useRef, useState } from "react";

export function MobileJoystick({ onMove }) {
  const base = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (event) => {
    const rect = base.current.getBoundingClientRect();
    const touch = event.touches ? event.touches[0] : event;
    const x = touch.clientX - rect.left - rect.width / 2;
    const y = touch.clientY - rect.top - rect.height / 2;
    const length = Math.hypot(x, y);
    const max = 42;
    const nx = length > max ? (x / length) * max : x;
    const ny = length > max ? (y / length) * max : y;
    setKnob({ x: nx, y: ny });
    onMove({ x: nx / max, y: ny / max, active: true });
  };

  const end = () => {
    setKnob({ x: 0, y: 0 });
    onMove({ x: 0, y: 0, active: false });
  };

  return (
    <div className="pointer-events-none absolute bottom-5 left-5 z-20 block md:hidden">
      <div
        ref={base}
        className="pointer-events-auto h-28 w-28 rounded-full border border-white/20 bg-black/30 backdrop-blur-xl"
        onPointerDown={update}
        onPointerMove={(event) => event.buttons === 1 && update(event)}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div
          className="joystick-knob mx-auto mt-7 h-14 w-14 rounded-full border border-white/30 bg-white/25 shadow-2xl"
          style={{ "--x": knob.x, "--y": knob.y }}
        />
      </div>
    </div>
  );
}
