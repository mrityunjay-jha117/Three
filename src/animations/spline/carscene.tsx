import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import { Suspense, useEffect, useRef, useState } from "react";
import type { mx_bilerp_0 } from "three/src/nodes/materialx/lib/mx_noise.js";

function Car() {
  const { scene } = useGLTF("/jameen.glb");
  const bodyRef = useRef<any>(null);
  const force = 20000;
  const speed = 5;

  useFrame((_, delta) => {
    const impulse = { x: 0, y: 0, z: 0 };
    const rotation = { x: 0, y: 0, z: 0 };
    // Handle keyboard input
    if (keys.forward) impulse.z += force * delta;
    if (keys.backward) impulse.z -= force * delta;
    if (keys.left) impulse.x -= force * delta;
    if (keys.right) impulse.x += force * delta;
    if (keys.top) impulse.y += force * delta*0.001;
    if (keys.bottom) impulse.y -= force * delta;

    if (bodyRef.current) {
      bodyRef.current.applyImpulse(impulse, true);
      bodyRef.current.rotation(rotation);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      name="Car"
      // colliders="trimesh"
      type="dynamic"
      position={[0, 2, -20]}
      friction={1.9}
      restitution={0.0002}
      mass={1}
    >
      <primitive object={scene} scale={1} rotation={[0,-8,0]} position={[1, 4, 0]} />
    </RigidBody>
  );
}

function Ramp() {
  const { scene } = useGLTF("/ramp.glb");
  scene.name = "Ramp"; // Required for collision detection

  return (
    <RigidBody type="fixed" name="Ramp">
      <primitive object={scene} position={[0, 0, 0]} />
    </RigidBody>
  );
}

function Ground() {
  return (
    <RigidBody type="fixed" colliders="cuboid" name="Ground">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 1000]} />
        <meshStandardMaterial color="lightgray" />
      </mesh>
    </RigidBody>
  );
}

// Keyboard controls
const keys = { forward: false, backward: false, left: false, right: false, top: false, bottom: false };
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyW") keys.forward = true;
  if (e.code === "KeyS") keys.backward = true;
  if (e.code === "KeyA") keys.left = true;
  if (e.code === "KeyD") keys.right = true;
  if (e.code === "KeyE") keys.top = true;
  if (e.code === "KeyF") keys.bottom = true;
});
window.addEventListener("keyup", (e) => {
  if (e.code === "KeyW") keys.forward = false;
  if (e.code === "KeyS") keys.backward = false;
  if (e.code === "KeyA") keys.left = false;
  if (e.code === "KeyD") keys.right = false;
  if (e.code === "KeyE") keys.top = false;
  if (e.code === "KeyF") keys.bottom = false;
});

export default function CarScene() {
  return (
    <Canvas camera={{ position: [-8, 40, 10], fov: 50 }} shadows>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 10, 5]} castShadow intensity={3} />
      <OrbitControls />
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <Ground />
          <Ramp />
          <Car />
        </Physics>
      </Suspense>
    </Canvas>
  );
}
