import { Sky } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Ocean } from "./Ocean.jsx";
import { Island } from "./Island.jsx";
import { Ship } from "./Ship.jsx";
import { Player } from "./Player.jsx";
import { PortfolioInteractables } from "./PortfolioInteractables.jsx";
import { useKeyboard } from "../hooks/useKeyboard.js";
import { ShipController } from "../systems/ShipController.jsx";
import { PlayerController } from "../systems/PlayerController.jsx";
import { useGame } from "../state/GameContext.jsx";

export function World() {
  const { gl } = useThree();
  const { mode } = useGame();
  useKeyboard();
  gl.toneMappingExposure = 1.05;

  return (
    <>
      <Sky distance={450000} sunPosition={[-9, 8, -4]} inclination={0.52} azimuth={0.26} rayleigh={1.8} mieCoefficient={0.006} mieDirectionalG={0.76} />
      <ambientLight intensity={0.38} />
      <directionalLight position={[-12, 18, -8]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-far={80} shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={35} shadow-camera-bottom={-35} />
      <pointLight position={[7, 3, 7]} color="#ffc66d" intensity={18} distance={24} />
      <Ocean />
      <Island />
      <Ship />
      {mode === "walk" ? <Player /> : null}
      <PortfolioInteractables />
      <ShipController />
      <PlayerController />
    </>
  );
}
