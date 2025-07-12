import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RigidBody, Physics, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

// Types
interface BodyProps {
  position: [number, number, number];
  color: number;
  mousePosition: THREE.Vector3;
}

interface MouseBallProps {
  mousePosition: THREE.Vector3;
}

// Constants
const SCENE_MIDDLE = new THREE.Vector3(0, 0, 0);
const COLOR_PALETTE = [
  0xef4444, // red-500
  0xf97316, // orange-500
  0xf59e0b, // amber-500
  0xeab308, // yellow-500
  0x84cc16, // lime-500
  0x22c55e, // green-500
  0x10b981, // emerald-500
  0x14b8a6, // teal-500
  0x06b6d4, // cyan-500
  0x0ea5e9, // sky-500
  0x3b82f6, // blue-500
  0x6366f1, // indigo-500
  0x8b5cf6, // violet-500
  0xa855f7, // purple-500
  0xd946ef, // fuchsia-500
  0xec4899, // pink-500
  0xf43f5e, // rose-500
  0x64748b, // slate-500
  0x6b7280, // gray-500
  0x737373, // neutral-500
  0x78716c, // stone-500
];

// Physical Body Component
const PhysicalBody: React.FC<BodyProps> = ({
  position,
  color,
  mousePosition,
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!rigidBodyRef.current || !meshRef.current) return;

    const rigidBody = rigidBodyRef.current;
    rigidBody.resetForces(true);

    const translation = rigidBody.translation();
    const pos = new THREE.Vector3(translation.x, translation.y, translation.z);
    const dir = pos.clone().sub(SCENE_MIDDLE).normalize();
    const distance = pos.length();

    // Apply force towards center with distance-based scaling to prevent overshooting
    const forceStrength = Math.min(-1.5, -distance * 0.3);
    rigidBody.addForce(dir.multiplyScalar(forceStrength), true);

    // Add mouse repulsion force
    const mouseDistance = pos.distanceTo(mousePosition);
    const repulsionRadius = 3.0; // Distance at which repulsion starts
    const repulsionStrength = 10.0; // Strength of repulsion

    if (mouseDistance < repulsionRadius) {
      const mouseDir = pos.clone().sub(mousePosition).normalize();
      const repulsionForce =
        (repulsionStrength * (repulsionRadius - mouseDistance)) /
        repulsionRadius;
      rigidBody.addForce(mouseDir.multiplyScalar(repulsionForce), true);
    }

    // Update mesh rotation
    const rotation = rigidBody.rotation();
    const quaternion = new THREE.Quaternion(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w,
    );
    meshRef.current.setRotationFromQuaternion(quaternion);
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      colliders="ball"
      linearDamping={2.0}
      angularDamping={2.0}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.25, 16, 16]} />{" "}
        {/* Reduced from 32,32 for better performance */}
        {/* <dodecahedronGeometry args={[0.25, 16]} /> */}
        <meshLambertMaterial color={color} />
      </mesh>
    </RigidBody>
  );
};

// Mouse Ball Component
const MouseBall: React.FC<MouseBallProps> = ({ mousePosition }) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  useFrame(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(mousePosition, true);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders="ball"
      position={[0, 0, 0]}
    >
      <mesh>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshLambertMaterial color="white" />
      </mesh>
    </RigidBody>
  );
};

// Mouse Interaction Hook
const useMouseInteraction = () => {
  const { camera, raycaster, pointer } = useThree();
  const [mousePosition, setMousePosition] = useState(
    new THREE.Vector3(0, 0, 0),
  );
  const mousePlaneRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!mousePlaneRef.current) return;

    // Orient the mouse plane to the camera
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.multiplyScalar(-1);
    mousePlaneRef.current.lookAt(cameraDirection);

    // Raycast to get mouse position in 3D space
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(
      [mousePlaneRef.current],
      false,
    );

    if (intersects.length > 0) {
      setMousePosition(intersects[0].point);
    }
  });

  return { mousePosition, mousePlaneRef };
};

// Main Physics Scene Component
const PhysicsScene: React.FC = () => {
  const { mousePosition, mousePlaneRef } = useMouseInteraction();

  // Generate random bodies
  const bodies = useMemo(() => {
    const bodyArray = [];
    const numBodies = 30;
    const range = 12;

    for (let i = 0; i < numBodies; i++) {
      const position: [number, number, number] = [
        Math.random() * range - range * 0.25,
        Math.random() * range - range * 0.25 + 0.05,
        Math.random() * range - range * 0.25,
      ];

      const color =
        COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];

      bodyArray.push({
        key: i,
        position,
        color,
      });
    }

    return bodyArray;
  }, []);

  return (
    <Physics gravity={[0, 0, 0]} debug={false}>
      {/* Mouse interaction plane (invisible) */}
      <mesh ref={mousePlaneRef} position={[0, 0, 0.2]}>
        <planeGeometry args={[48, 48]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Physical bodies */}
      {bodies.map((body) => (
        <PhysicalBody
          key={body.key}
          position={body.position}
          color={body.color}
          mousePosition={mousePosition}
        />
      ))}

      {/* Mouse ball */}
      <MouseBall mousePosition={mousePosition} />

      {/* Better lighting for 3D appearance */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
    </Physics>
  );
};

// Main R3F Component
const RapierPhysics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Give some time for geometries to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        const ext = gl?.getExtension("WEBGL_lose_context");
        ext?.loseContext();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          fontSize: "1.5rem",
        }}
      >
        Loading Physics Scene...
      </div>
    );
  }
  return (
    <div
      style={{ width: "100vw", height: "100vh", backgroundColor: "#000000" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        scene={{ background: new THREE.Color(0x000000) }}
      >
        <OrbitControls enableZoom={false} enableDamping />
        <PhysicsScene />
      </Canvas>
    </div>
  );
};

export default RapierPhysics;
