import { useEffect, useRef } from "react";
import { useGame } from "../state/GameContext.jsx";

function createTone(context, frequency, gainValue) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  return { oscillator, gain };
}

export function AmbientAudio() {
  const { activePanel, mode } = useGame();
  const audio = useRef(null);
  const lastPanel = useRef(null);

  useEffect(() => {
    const start = () => {
      if (audio.current) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const bed = createTone(context, 58, 0.018);
      const shimmer = createTone(context, 116, 0.006);
      audio.current = { context, bed, shimmer };
    };

    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      if (!audio.current) return;
      audio.current.bed.oscillator.stop();
      audio.current.shimmer.oscillator.stop();
      audio.current.context.close();
      audio.current = null;
    };
  }, []);

  useEffect(() => {
    if (!audio.current) return;
    audio.current.bed.gain.gain.setTargetAtTime(mode === "ship" || mode === "bike" ? 0.02 : 0.014, audio.current.context.currentTime, 0.4);
  }, [mode]);

  useEffect(() => {
    if (!audio.current || !activePanel || activePanel === lastPanel.current) return;
    lastPanel.current = activePanel;
    const { context } = audio.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(420, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(760, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
  }, [activePanel]);

  return null;
}
