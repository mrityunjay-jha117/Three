import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Decal, useTexture } from "@react-three/drei";

function Ball() {
  const logo = useTexture("/textures/10.png"); // Image path in public folder

  return (
    <mesh>
      {/* Sphere as the billiard ball */}
      <sphereGeometry args={[3, 64, 64]} />
      <meshStandardMaterial color="red" />

      {/* Decal image like billiard ball number */}
      <Decal
        map={logo}
        position={[0, 0, 3]}           // Front face of sphere
        rotation={[0, 0, 0]}           // No rotation
        scale={1.5}                    // Size of decal on ball
        // flatShading
      />
    </mesh>
  );
}

export default function BallScene() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Ball />
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
