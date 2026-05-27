import { Cloud, Sparkles, Stars } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Ocean } from "./Ocean.jsx";
import { Island } from "./Island.jsx";
import { Ship } from "./Ship.jsx";
import { Player } from "./Player.jsx";
import { Bicycle } from "./Bicycle.jsx";
import { PortfolioInteractables } from "./PortfolioInteractables.jsx";
import { useKeyboard } from "../hooks/useKeyboard.js";
import { ShipController } from "../systems/ShipController.jsx";
import { PlayerController } from "../systems/PlayerController.jsx";
import { BikeController } from "../systems/BikeController.jsx";
import { useGame } from "../state/GameContext.jsx";
import { isPhoneDevice } from "../utils/device.js";

function NightLighting({ isPhone }) {
  const roadLights = [
    [0, 3.0, 84, "#ffc982", 10, 20],
    [0, 2.6, 61, "#ffd19a", 7, 16],
    [0, 2.6, 38, "#ffd19a", 7, 16],
    [-20, 2.8, 22, "#9cecff", 6, 15],
    [-43, 3.0, -16, "#ffd19a", 7, 16],
    [28, 2.8, 8, "#8df7ff", 7, 17],
    [54, 3.0, -12, "#72ffb7", 8, 18],
    [-29, 3.0, 55, "#ff8ad8", 8, 18],
    [39, 3.0, 49, "#b8a8ff", 8, 18],
  ];

  return (
    <group>
      <hemisphereLight intensity={isPhone ? 0.55 : 0.72} color="#9cc8ff" groundColor="#172118" />
      <directionalLight position={[42, 34, 28]} intensity={isPhone ? 0.35 : 0.52} color="#8fb7ff" />
      <spotLight position={[0, 18, 92]} color="#ffc47d" intensity={isPhone ? 24 : 42} distance={75} angle={0.56} penumbra={0.92} />
      <spotLight position={[-72, 18, 18]} color="#ffb86b" intensity={isPhone ? 15 : 26} distance={52} angle={0.46} penumbra={0.84} />
      <spotLight position={[64, 22, -18]} color="#72ffb7" intensity={isPhone ? 18 : 32} distance={62} angle={0.5} penumbra={0.86} />
      <spotLight position={[-46, 15, -40]} color="#7df9ff" intensity={isPhone ? 13 : 24} distance={48} angle={0.44} penumbra={0.86} />
      <pointLight position={[0, 1.1, 102]} color="#7df9ff" intensity={isPhone ? 7 : 13} distance={26} />
      <pointLight position={[0, 0.55, 112]} color="#4ccfff" intensity={isPhone ? 4 : 8} distance={36} />
      <pointLight position={[0, 0.35, 8]} color="#7ba6ff" intensity={isPhone ? 3 : 5.5} distance={118} />
      {roadLights.map(([x, y, z, color, intensity, distance], index) => (
        <pointLight
          key={`road-light-${index}`}
          position={[x, y, z]}
          color={color}
          intensity={isPhone ? intensity * 0.56 : intensity}
          distance={distance}
        />
      ))}
    </group>
  );
}

export function World() {
  const { gl } = useThree();
  const { mode } = useGame();
  const isPhone = isPhoneDevice();
  useKeyboard();
  gl.toneMappingExposure = isPhone ? 0.92 : 1.05;

  return (
    <>
      <fog attach="fog" args={["#061018", 46, 215]} />
      <Stars radius={220} depth={70} count={isPhone ? 800 : 1800} factor={4} saturation={0.2} fade speed={0.25} />
      {!isPhone ? (
        <group position={[-34, 26, -40]}>
          <Cloud opacity={0.16} speed={0.12} width={42} depth={8} segments={18} color="#526070" />
          <Cloud opacity={0.1} speed={0.08} width={34} depth={7} segments={14} color="#7a8796" position={[34, 3, 18]} />
        </group>
      ) : null}
      <ambientLight intensity={isPhone ? 0.42 : 0.36} color="#9bbdff" />
      <directionalLight
        position={[-18, 26, -16]}
        intensity={isPhone ? 1.18 : 1.58}
        castShadow={!isPhone}
        color="#b9ccff"
        shadow-mapSize={isPhone ? [512, 512] : [3072, 3072]}
        shadow-camera-far={210}
        shadow-camera-left={-135}
        shadow-camera-right={135}
        shadow-camera-top={135}
        shadow-camera-bottom={-135}
      />
      <NightLighting isPhone={isPhone} />
      <spotLight position={[28, 28, 96]} color="#6ee7ff" intensity={isPhone ? 18 : 34} distance={180} angle={0.42} penumbra={0.9} castShadow={!isPhone} />
      <pointLight position={[-72, 8, 12]} color="#ffb86b" intensity={isPhone ? 9 : 15} distance={34} />
      <pointLight position={[64, 12, -20]} color="#68ffc8" intensity={isPhone ? 9 : 16} distance={38} />
      <pointLight position={[-34, 8, 64]} color="#ff8ad8" intensity={isPhone ? 8 : 14} distance={34} />
      {!isPhone ? <Sparkles count={150} scale={[230, 30, 230]} size={1.4} speed={0.18} opacity={0.24} color="#b9e8ff" position={[0, 10, 8]} /> : null}
      <Ocean />
      <Island />
      <Ship />
      <Bicycle />
      {mode === "walk" ? <Player /> : null}
      <PortfolioInteractables />
      <ShipController />
      <PlayerController />
      <BikeController />
    </>
  );
}
